# 🐳 Cards App - Docker Deployment

## Requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Clone e navegue até o projeto
```bash
cd cards
```

### 2. Crie o arquivo de ambiente
```bash
cp .env.example .env
# Edite .env com suas configurações (especialmente SECRET_KEY em produção)
```

### 3. Build e execute
```bash
# Build e iniciar todos os serviços
docker-compose up --build

# Ou em modo detached (background)
docker-compose up --build -d
```

### 4. Acesse a aplicação
- **Frontend**: http://localhost
- **API**: http://localhost/api
- **Admin Django**: http://localhost:8000/admin

### Credenciais padrão
- **Usuário**: admin
- **Senha**: admin123

⚠️ **IMPORTANTE**: Mude essas credenciais em produção!

## Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Parar os serviços
docker-compose down

# Parar e remover volumes (dados do banco)
docker-compose down -v

# Rebuild de um serviço específico
docker-compose build backend

# Executar comando no container backend
docker-compose exec backend python manage.py createsuperuser

# Acessar shell do Django
docker-compose exec backend python manage.py shell

# Executar migrations manualmente
docker-compose exec backend python manage.py migrate
```

## Estrutura dos Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| frontend | 80 | React + Nginx |
| backend | 8000 | Django + Gunicorn |
| db | 5432 | PostgreSQL 16 |

## Volumes

| Volume | Descrição |
|--------|-----------|
| postgres_data | Dados do PostgreSQL |
| static_volume | Arquivos estáticos do Django |
| media_volume | Uploads de mídia |

## Configuração de Produção

### 1. Gere uma SECRET_KEY segura
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2. Atualize o .env
```env
SECRET_KEY=sua-chave-super-secreta-aqui
DEBUG=False
ALLOWED_HOSTS=seu-dominio.com,www.seu-dominio.com
```

### 3. Configure HTTPS (recomendado)
Adicione um proxy reverso como Traefik ou Nginx com Let's Encrypt.

## Troubleshooting

### Erro de conexão com banco de dados
```bash
# Verifique se o postgres está rodando
docker-compose ps
docker-compose logs db
```

### Migrations não executadas
```bash
docker-compose exec backend python manage.py migrate
```

### Arquivos estáticos não carregando
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### Limpar tudo e recomeçar
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```
