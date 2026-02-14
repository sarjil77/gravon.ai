FROM python:3.12-slim

WORKDIR /app

# Copy project metadata and backend source (context is project root)
COPY pyproject.toml ./
COPY backend/ ./backend/

# Install the package
RUN pip install --no-cache-dir .

# Set working directory to backend so uvicorn finds the app module
WORKDIR /app/backend

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
