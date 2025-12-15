# CardSudo - Yu-Gi-Oh! TCG Marketplace 🎴

Um marketplace de cartas colecionáveis de Yu-Gi-Oh! com visualização 3D interativa.

## 🚀 Funcionalidades

- ✅ **Autenticação**: Login/Registro com JWT
- ✅ **Catálogo**: Busca de +10.000 cartas da API YGOProDeck
- ✅ **Visualizador 3D**: Visualize cartas em 3D interativo (Three.js)
- ✅ **Marketplace**: Compre e venda cartas com outros usuários
- ✅ **Carteira**: Sistema de tokens para transações
- ✅ **Carrinho**: Compre múltiplas cartas de uma vez
- ✅ **Minhas Cartas**: Visualize sua coleção
- ✅ **Painel Admin**: Gestão de usuários e transações
- ✅ **Mobile-First**: Design responsivo para todos dispositivos

---

## 🛠️ Tech Stack

### Backend
- **Python 3.13** + **Django 6.0**
- Django REST Framework
- SimpleJWT (autenticação)
- PostgreSQL 16 (produção/Docker)
- SQLite (desenvolvimento local)
- Pillow (processamento de imagens)
- Gunicorn (servidor WSGI)

### Frontend
- **React 19** + **Vite**
- Tailwind CSS v4
- Three.js / React Three Fiber (visualização 3D)
- Axios (requisições HTTP)
- React Router DOM v7

### Infraestrutura
- **Docker** + **Docker Compose**
- Nginx (proxy reverso + servidor estático)
- PostgreSQL 16 Alpine

---

## 🐳 Rodando com Docker (Recomendado)

A forma mais fácil de rodar o projeto é usando Docker. Todos os serviços (banco, backend, frontend) são configurados automaticamente.

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Git

### Passo a Passo

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd cards

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env

# 3. (Opcional) Edite o .env para personalizar configurações
# - SECRET_KEY: Altere em produção!
# - POSTGRES_PASSWORD: Altere em produção!

# 4. Suba os containers
docker compose up --build

# Aguarde todos os serviços iniciarem (cerca de 1-2 minutos na primeira vez)
```

### Acessando a Aplicação

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend** | http://localhost | - |
| **API** | http://localhost/api | - |
| **Admin Django** | http://localhost:8000/admin | `admin` / `admin123` |
| **PostgreSQL** | localhost:5432 | `cards_user` / `cards_password` |

### Comandos Docker Úteis

```bash
# Subir em background
docker compose up -d

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend

# Parar os containers
docker compose down

# Parar e remover volumes (APAGA O BANCO!)
docker compose down -v

# Rebuild forçado (após mudanças no Dockerfile)
docker compose build --no-cache

# Acessar shell do container backend
docker compose exec backend bash

# Rodar comando Django
docker compose exec backend python manage.py <comando>

# Criar novo superusuário
docker compose exec backend python manage.py createsuperuser
```

### Troubleshooting Docker

**Windows: "docker compose" não encontrado**
```powershell
# Use o caminho completo
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up
```

**Erro de permissão no Docker (Windows)**
```powershell
# Execute PowerShell como Administrador
```

**Containers não conectam no banco**
```bash
# Verifique se o postgres está healthy
docker compose ps

# Se necessário, reinicie tudo
docker compose down -v
docker compose up --build
```

---

## 💻 Desenvolvimento Local (Sem Docker)

Para desenvolvimento com hot-reload, você pode rodar backend e frontend localmente.

### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv .venv

# Ativar ambiente
.venv\Scripts\activate     # Windows
source .venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env - defina USE_SQLITE=True para desenvolvimento

# Rodar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Rodar servidor de desenvolvimento
python manage.py runserver
```

O backend estará disponível em `http://localhost:8000`

### Frontend

```bash
cd card-sudo-front

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Edite .env.local
# VITE_API_URL=http://localhost:8000/api

# Rodar em desenvolvimento (hot-reload)
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

---

## 📁 Estrutura do Projeto

```
cards/
├── backend/                    # Django Backend
│   ├── config/                 # Configurações Django
│   │   ├── settings.py         # Settings principal
│   │   ├── urls.py             # URLs raiz
│   │   └── wsgi.py             # WSGI para produção
│   ├── wallet/                 # App principal
│   │   ├── models.py           # User, Card, Listing, Transaction...
│   │   ├── views.py            # ViewSets da API
│   │   ├── serializers.py      # Serializers DRF
│   │   └── urls.py             # URLs da API
│   ├── Dockerfile              # Container do backend
│   ├── docker-entrypoint.sh    # Script de inicialização
│   ├── requirements.txt        # Dependências Python
│   └── manage.py
│
├── card-sudo-front/            # React Frontend
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── pages/              # Páginas (rotas)
│   │   ├── contexts/           # Context API (Auth, Cart, Toast)
│   │   ├── services/           # API client (axios)
│   │   └── App.jsx             # App principal + rotas
│   ├── Dockerfile              # Build + Nginx
│   ├── nginx.conf              # Config do Nginx
│   └── package.json
│
├── docker-compose.yml          # Orquestração dos serviços
├── .env.example                # Template de variáveis
└── README.md                   # Este arquivo
```

---

## 🔧 Fazendo Alterações

### Alterando o Backend

1. **Modelos (banco de dados)**
   ```bash
   # Edite backend/wallet/models.py
   
   # Crie a migration
   docker compose exec backend python manage.py makemigrations
   
   # Aplique a migration
   docker compose exec backend python manage.py migrate
   ```

2. **Endpoints da API**
   - Edite `backend/wallet/views.py` para lógica
   - Edite `backend/wallet/serializers.py` para formato dos dados
   - Edite `backend/wallet/urls.py` para novas rotas

3. **Configurações Django**
   - Edite `backend/config/settings.py`

4. **Após alterações no backend com Docker rodando:**
   ```bash
   # O Gunicorn não tem hot-reload, então:
   docker compose restart backend
   ```

### Alterando o Frontend

1. **Componentes e Páginas**
   - Componentes reutilizáveis em `card-sudo-front/src/components/`
   - Páginas em `card-sudo-front/src/pages/`

2. **Rotas**
   - Edite `card-sudo-front/src/App.jsx`

3. **Chamadas à API**
   - Cliente axios em `card-sudo-front/src/services/api.js`

4. **Estilos**
   - Tailwind CSS inline nos componentes
   - Config em `card-sudo-front/tailwind.config.js`

5. **Com Docker:**
   ```bash
   # Frontend precisa rebuild após alterações
   docker compose build frontend
   docker compose up -d frontend
   ```

### Adicionando Dependências

**Backend (Python):**
```bash
# Adicione ao requirements.txt
echo "nova-biblioteca>=1.0" >> backend/requirements.txt

# Rebuild o container
docker compose build backend
docker compose up -d backend
```

**Frontend (Node):**
```bash
# Entre no diretório
cd card-sudo-front

# Instale a dependência
npm install nova-biblioteca

# Rebuild o container
docker compose build frontend
docker compose up -d frontend
```

---

## 🌐 Deploy em Produção

### Variáveis de Ambiente Importantes

```env
# OBRIGATÓRIO mudar em produção!
SECRET_KEY=sua-chave-secreta-muito-longa-e-aleatoria
POSTGRES_PASSWORD=senha-forte-do-banco

# Configurar domínio
ALLOWED_HOSTS=seu-dominio.com,www.seu-dominio.com
CORS_ALLOWED_ORIGINS=https://seu-dominio.com
```

### Deploy com Docker (VPS/Cloud)

1. Copie os arquivos para o servidor
2. Configure o `.env` com valores de produção
3. Configure um proxy reverso (Nginx/Traefik) com SSL
4. Execute `docker compose up -d`

### Deploy Separado

**Backend (Railway/Render/Heroku):**
- Use o Dockerfile do backend
- Configure variáveis de ambiente
- O `Procfile` usa Gunicorn

**Frontend (Vercel/Netlify):**
- Build command: `npm run build`
- Output: `dist`
- Configure `VITE_API_URL` para URL do backend

---

## 📊 API Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/wallet/auth/register/` | Registro de usuário |
| POST | `/api/wallet/auth/login/` | Login (retorna JWT) |
| GET | `/api/wallet/auth/me/` | Dados do usuário logado |
| GET | `/api/wallet/balance/` | Saldo da carteira |
| GET | `/api/market/listings/` | Listar anúncios |
| POST | `/api/market/listings/` | Criar anúncio |
| POST | `/api/market/buy/<id>/` | Comprar carta |
| GET | `/api/my-cards/` | Minhas cartas |
| GET | `/api/admin-panel/users/` | Admin: listar usuários |

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Add: nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.
