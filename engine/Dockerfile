# ============================================================
# HushVoice Engine — local zero-shot cloning & multilingual TTS
# ============================================================

ARG PYTORCH_VARIANT=cpu

FROM python:3.11-slim AS backend-builder

ARG PYTORCH_VARIANT=cpu
ARG ROCM_VERSION=6.3

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir --upgrade pip

RUN if [ "$PYTORCH_VARIANT" = "rocm" ]; then \
      pip install --no-cache-dir --prefix=/install \
        --index-url "https://download.pytorch.org/whl/rocm${ROCM_VERSION}" \
        torch torchaudio && \
      printf '[global]\nindex-url = https://download.pytorch.org/whl/rocm%s\nextra-index-url = https://pypi.org/simple\n' "$ROCM_VERSION" > /etc/pip.conf; \
    fi

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt \
    && pip install --no-cache-dir --prefix=/install --no-deps chatterbox-tts \
    && pip install --no-cache-dir --prefix=/install --no-deps hume-tada \
    && pip install --no-cache-dir --prefix=/install \
      git+https://github.com/QwenLM/Qwen3-TTS.git || true

FROM python:3.11-slim

RUN groupadd -r hushvoice && \
    useradd -r -g hushvoice -m -s /bin/bash hushvoice

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    gosu \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /install /usr/local
COPY backend/ /app/backend/

RUN mkdir -p /app/data/generations /app/data/profiles /app/data/cache \
    && chown -R hushvoice:hushvoice /app/data /app/backend \
    && mkdir -p /home/hushvoice/.cache/huggingface \
    && chown -R hushvoice:hushvoice /home/hushvoice

EXPOSE 17493

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
    CMD curl -f http://localhost:17493/health || exit 1

USER hushvoice
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "17493"]
