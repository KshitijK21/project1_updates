import time
from collections import defaultdict

from fastapi import HTTPException, Request

_buckets = {}


def rate_limit(max_requests: int, window_seconds: int = 60):
    bucket_id = object()
    _buckets[bucket_id] = defaultdict(list)

    def dependency(request: Request):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        bucket = _buckets[bucket_id][ip]
        bucket[:] = [t for t in bucket if now - t < window_seconds]
        if len(bucket) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        bucket.append(now)

    return dependency