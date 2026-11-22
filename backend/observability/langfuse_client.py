"""
Langfuse Observability Client (v3 / v5 SDK)
Provides tracing for NLU, Planner, and Agent operations following Langfuse best practices.
"""
from typing import Optional, Any, Dict
import time

# Import config which loads .env
from config import LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST

# Try to import langfuse, handle gracefully if not installed or incompatible
try:
    from langfuse import Langfuse
    LANGFUSE_AVAILABLE = True
except Exception:
    LANGFUSE_AVAILABLE = False
    Langfuse = None


# Global client instance
_client: Optional[Any] = None
_enabled = False


class _ObservationWrapper:
    """Wraps a Langfuse observation object to provide safe, backwards-compatible .update() and .end() handling."""

    def __init__(self, raw_obs: Any):
        self._raw_obs = raw_obs
        self.id = getattr(raw_obs, 'id', None)
        self.trace_id = getattr(raw_obs, 'trace_id', None)

    def update(self, **kwargs):
        if not self._raw_obs:
            return
        try:
            if "usage" in kwargs:
                usage = kwargs.pop("usage")
                if isinstance(usage, dict) and "usage_details" not in kwargs:
                    kwargs["usage_details"] = {
                        "input": int(usage.get("input", usage.get("prompt_tokens", 0))),
                        "output": int(usage.get("output", usage.get("completion_tokens", 0))),
                        "total": int(usage.get("total", usage.get("total_tokens", 0))),
                    }
            self._raw_obs.update(**kwargs)
        except Exception as e:
            print(f"[Langfuse] Update observation warning: {e}")

    def end(self, **kwargs):
        if not self._raw_obs:
            return
        try:
            if kwargs:
                self.update(**kwargs)
            self._raw_obs.end()
        except Exception as e:
            print(f"[Langfuse] End observation warning: {e}")

    def __getattr__(self, name: str) -> Any:
        return getattr(self._raw_obs, name)


def init_langfuse() -> bool:
    """Initialize Langfuse client. Returns True if successful."""
    global _client, _enabled

    if not LANGFUSE_AVAILABLE:
        print("⚠️ Langfuse not installed. Run: pip install langfuse")
        return False

    if not LANGFUSE_PUBLIC_KEY or not LANGFUSE_SECRET_KEY:
        print("⚠️ Langfuse keys not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY")
        return False

    try:
        _client = Langfuse(
            public_key=LANGFUSE_PUBLIC_KEY,
            secret_key=LANGFUSE_SECRET_KEY,
            host=LANGFUSE_HOST,
            timeout=15,
        )

        # Backwards-compatible helpers for code calling start_generation / start_span on client
        def _compat_start_generation(*args, **kwargs):
            tc = kwargs.pop("trace_context", {})
            name = kwargs.pop("name", "generation")
            model = kwargs.pop("model", None)
            inp = kwargs.pop("input", None)
            meta = kwargs.pop("metadata", None)
            obs = _client.start_observation(
                trace_context=tc,
                name=name,
                as_type="generation",
                model=model,
                input=inp,
                metadata=meta,
                **kwargs
            )
            return _ObservationWrapper(obs)

        def _compat_start_span(*args, **kwargs):
            tc = kwargs.pop("trace_context", {})
            name = kwargs.pop("name", "span")
            as_type = kwargs.pop("as_type", "span")
            obs = _client.start_observation(
                trace_context=tc,
                name=name,
                as_type=as_type,
                **kwargs
            )
            return _ObservationWrapper(obs)

        if not hasattr(_client, "start_generation"):
            _client.start_generation = _compat_start_generation
        if not hasattr(_client, "start_span"):
            _client.start_span = _compat_start_span

        _enabled = True
        print("✅ Langfuse initialized successfully (v3/v5 SDK)")
        return True
    except Exception as e:
        print(f"⚠️ Failed to initialize Langfuse: {e}")
        return False


def get_client() -> Optional[Any]:
    """Get the raw Langfuse client instance."""
    return _client


def is_enabled() -> bool:
    """Check if Langfuse tracing is enabled."""
    return _enabled


def create_trace(
    name: str,
    session_id: str,
    user_id: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> Optional[Any]:
    """
    Create a new trace for a session using Langfuse SDK.
    Uses 'agent' observation type as root according to multi-agent best practices.
    """
    if not _enabled or not _client:
        return None

    try:
        trace_id = _client.create_trace_id()
        obs = _client.start_observation(
            name=name,
            as_type="agent",
            trace_context={"trace_id": trace_id},
            metadata={
                **(metadata or {}),
                "session_id": session_id,
                "user_id": user_id or "anonymous",
            },
        )
        return _TraceWrapper(trace_id=trace_id, root_span=obs, session_id=session_id)
    except Exception as e:
        print(f"⚠️ Failed to create trace: {e}")
        return None


def get_trace_url(trace_id: str) -> str:
    """Get the public URL for a trace."""
    if _enabled and _client:
        try:
            url = _client.get_trace_url(trace_id=trace_id)
            if url:
                return url
        except Exception:
            pass
    return f"{LANGFUSE_HOST}/trace/{trace_id}"


class _TraceWrapper:
    """Wraps a Langfuse root span to provide a trace-like interface."""

    def __init__(self, trace_id: str, root_span: Any, session_id: str):
        self.id = trace_id
        self._root_span = root_span
        self.session_id = session_id

    def span(self, name: str, **kwargs) -> Any:
        """Create a child span observation."""
        if not _client:
            return _NoopSpan()
        try:
            tc = {"trace_id": self.id}
            if hasattr(self._root_span, "id") and self._root_span.id:
                tc["parent_span_id"] = self._root_span.id
            obs = _client.start_observation(
                name=name,
                as_type="span",
                trace_context=tc,
                **kwargs,
            )
            return _ObservationWrapper(obs)
        except Exception:
            return _NoopSpan()

    def generation(self, name: str, **kwargs) -> Any:
        """Create a child generation observation."""
        if not _client:
            return _NoopSpan()
        try:
            tc = {"trace_id": self.id}
            if hasattr(self._root_span, "id") and self._root_span.id:
                tc["parent_span_id"] = self._root_span.id
            obs = _client.start_observation(
                name=name,
                as_type="generation",
                trace_context=tc,
                **kwargs,
            )
            return _ObservationWrapper(obs)
        except Exception:
            return _NoopSpan()

    def end(self, **kwargs):
        """End the root observation."""
        try:
            if self._root_span:
                if kwargs and hasattr(self._root_span, "update"):
                    self._root_span.update(**kwargs)
                if hasattr(self._root_span, "end"):
                    self._root_span.end()
        except Exception:
            pass


class _NoopSpan:
    """No-op span for when Langfuse is not available."""
    id = None

    def __init__(self, **_kwargs):
        pass

    def end(self, **_kwargs):
        pass

    def update(self, **_kwargs):
        pass


class TracedOperation:
    """Context manager for tracing operations."""

    def __init__(
        self,
        trace: Any,
        name: str,
        operation_type: str = "span",
        metadata: Optional[Dict] = None,
    ):
        self.trace = trace
        self.name = name
        self.operation_type = operation_type
        self.metadata = metadata or {}
        self.span = None
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        if self.trace:
            try:
                if self.operation_type == "generation":
                    self.span = self.trace.generation(
                        name=self.name,
                        metadata=self.metadata,
                    )
                else:
                    self.span = self.trace.span(
                        name=self.name,
                        metadata=self.metadata,
                    )
            except Exception as e:
                print(f"⚠️ TracedOperation enter failed: {e}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time if self.start_time else 0
        if self.span:
            try:
                self.span.update(
                    metadata={"duration_ms": round(duration * 1000)},
                    level="ERROR" if exc_type else "DEFAULT",
                    status_message=str(exc_val) if exc_val else "OK",
                )
                self.span.end()
            except Exception:
                pass
        return False

    def update(self, **kwargs):
        """Update span with additional data."""
        if self.span:
            try:
                self.span.update(**kwargs)
            except Exception:
                pass

    def log_input(self, input_data: Any):
        """Log input to the span."""
        if self.span:
            try:
                self.span.update(input=input_data)
            except Exception:
                pass

    def log_output(self, output_data: Any):
        """Log output to the span."""
        if self.span:
            try:
                self.span.update(output=output_data)
            except Exception:
                pass


def flush():
    """Flush any pending traces."""
    if _client:
        try:
            _client.flush()
        except Exception:
            pass
