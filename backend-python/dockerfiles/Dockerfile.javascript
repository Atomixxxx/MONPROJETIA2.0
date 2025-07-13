FROM node:18-slim

# Installer timeout et nettoyer
RUN useradd -m -u 1000 sandbox && \
    apt-get update && \
    apt-get install -y --no-install-recommends timeout && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Utilisateur non-privilégié
USER sandbox
WORKDIR /app

# Copier et exécuter le script
COPY script.js .
CMD ["timeout", "30s", "node", "script.js"]
