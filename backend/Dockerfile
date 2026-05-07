FROM python:3.11-slim AS builder
WORKDIR /build

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libc-dev && \
    rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim AS runner
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libgomp1 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY . .

RUN mkdir -p uploads checkpoints data

EXPOSE 8000

VOLUME ["/app/uploads", "/app/checkpoints"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
