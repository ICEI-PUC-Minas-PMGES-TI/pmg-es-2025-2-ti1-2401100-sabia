# 📦 Estrutura Final do Projeto Sabiaa

## 🎯 Visão Geral

O projeto está organizado seguindo o padrão **MVC (Model-View-Controller)** com separação de responsabilidades em camadas.

```
📦 JSONServer-Sabiaa/
├── 📂 src/                          # Código-fonte da aplicação
│   │
│   ├── 📂 config/                   # Configurações do sistema
│   │   ├── database.js              # Acesso ao banco de dados JSON
│   │   ├── email.js                 # Configuração de email (SMTP, templates)
│   │   └── jwt.js                   # Configuração JWT (secret, expiração)
│   │
│   ├── 📂 controllers/              # Camada de Apresentação (Controllers)
│   │   ├── auth.controller.js       # Controla autenticação (cadastro, login, recuperação)
│   │   └── user.controller.js       # Controla usuários (perfil, CRUD, favoritos)
│   │
│   ├── 📂 middlewares/              # Middlewares da aplicação
│   │   └── auth.js                  # Middleware de autenticação JWT e permissões
│   │
│   ├── 📂 routes/                   # Definição de rotas da API
│   │   ├── index.js                 # Agregador de todas as rotas
│   │   ├── auth.routes.js           # Rotas de autenticação (/api/auth/*)
│   │   └── user.routes.js           # Rotas de usuários (/api/users/*)
│   │
│   ├── 📂 services/                 # Camada de Negócio (Services)
│   │   ├── auth.service.js          # Lógica de negócio de autenticação
│   │   └── user.service.js          # Lógica de negócio de usuários
│   │
│   ├── 📂 utils/                    # Utilitários e Helpers
│   │   ├── helpers.js               # Funções auxiliares reutilizáveis
│   │   └── recoveryTokens.js        # Gerenciamento de tokens de recuperação
│   │
│   └── 📂 validators/               # Validadores de dados
│       └── auth.validator.js        # Validação de dados de autenticação
│
├── 📂 db/                           # Banco de dados
│   ├── db.json                      # Banco de dados principal (JSON)
│   ├── db_original.json             # Backup do banco original
│   └── db (copy).json               # Cópia de segurança
│
├── 📂 docs/                         # Documentação completa
│   ├── API.md                       # Referência completa da API (todos os endpoints)
│   ├── QUICK_START.md               # Guia de início rápido
│   ├── EXEMPLOS_TESTE.md            # Exemplos de teste (cURL, Postman, etc.)
│   ├── CONTRIBUTING.md              # Guia de contribuição
│   └── COMANDOS_UTEIS.md            # Comandos úteis para desenvolvimento
│
├── 📂 public/                       # Arquivos públicos acessíveis via HTTP
│   ├── index.html                   # Página inicial da API (landing page)
│   └── teste-api.html               # Interface interativa para testar endpoints
│
├── 📄 index.js                      # Ponto de entrada da aplicação
├── 📄 package.json                  # Dependências e scripts npm
├── 📄 package-lock.json             # Lock de versões das dependências
│
├── 📄 README.md                     # Documentação principal do projeto
├── 📄 CHANGELOG.md                  # Histórico de mudanças e versões
├── 📄 LICENSE                       # Licença do projeto (ISC)
│
├── 📄 .env                          # Variáveis de ambiente (não versionar!)
├── 📄 .env.example                  # Exemplo de variáveis de ambiente
├── 📄 .gitignore                    # Arquivos ignorados pelo Git
└── 📄 .gitattributes                # Configurações de atributos do Git
```

---

## 🏗️ Arquitetura em Camadas

### 1️⃣ **Camada de Rotas** (`src/routes/`)
- Define os endpoints da API
- Mapeia URLs para controllers
- Aplica middlewares específicos (autenticação, validação)

**Exemplo:**
```javascript
router.post('/cadastro', 
    authValidator.cadastro, // Validação
    authController.cadastro  // Controller
);
```

### 2️⃣ **Camada de Controllers** (`src/controllers/`)
- Recebe requisições HTTP
- Valida entrada de dados
- Chama services para lógica de negócio
- Retorna respostas HTTP padronizadas

**Exemplo:**
```javascript
async cadastro(req, res) {
    const resultado = await authService.cadastrarUsuario(req.body);
    return res.status(201).json(resultado);
}
```

### 3️⃣ **Camada de Services** (`src/services/`)
- Contém toda a lógica de negócio
- Interage com o banco de dados
- Processa regras de negócio
- Retorna dados processados

**Exemplo:**
```javascript
async cadastrarUsuario(dados) {
    // Validações
    // Hash de senha
    // Salvar no banco
    // Gerar JWT
    // Enviar email
    return { success, message, data };
}
```

### 4️⃣ **Camada de Middlewares** (`src/middlewares/`)
- Intercepta requisições
- Verifica autenticação (JWT)
- Valida permissões
- Manipula erros

**Exemplo:**
```javascript
async verificarToken(req, res, next) {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token);
    req.usuario = decoded;
    next();
}
```

### 5️⃣ **Camada de Validação** (`src/validators/`)
- Valida dados de entrada
- Sanitiza campos
- Retorna erros de validação
- Usa Express Validator

**Exemplo:**
```javascript
cadastro: [
    body('email').isEmail(),
    body('senha').isLength({ min: 8 }),
    // ...
]
```

### 6️⃣ **Camada de Configuração** (`src/config/`)
- Configurações centralizadas
- Acesso ao banco de dados
- Configuração de JWT
- Templates de email

### 7️⃣ **Camada de Utilitários** (`src/utils/`)
- Funções auxiliares reutilizáveis
- Helpers diversos
- Gerenciamento de tokens
- Formatações

---

## 🔄 Fluxo de uma Requisição

```
┌─────────────┐
│   Cliente   │ (Navegador, Postman, cURL)
└──────┬──────┘
       │ HTTP Request (POST /api/auth/cadastro)
       ▼
┌─────────────────────┐
│   Express Server    │ (index.js)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Rotas (Routes)     │ (auth.routes.js)
└──────────┬──────────┘
           │
           ├─► Middleware de Validação (validators)
           │
           ▼
┌─────────────────────┐
│ Controller          │ (auth.controller.js)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Service             │ (auth.service.js)
└──────────┬──────────┘
           │
           ├─► Config (database.js, jwt.js, email.js)
           ├─► Utils (helpers.js)
           │
           ▼
┌─────────────────────┐
│  Banco de Dados     │ (db.json)
└──────────┬──────────┘
           │
           ▼ (Response com dados processados)
┌─────────────────────┐
│     Cliente         │
└─────────────────────┘
```

---

## 📊 Endpoints Disponíveis

### 🔐 Autenticação (`/api/auth`)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/cadastro` | Cadastrar novo usuário |
| POST | `/login` | Fazer login |
| POST | `/recuperar-senha` | Solicitar recuperação de senha |
| POST | `/alterar-senha` | Alterar senha com código |
| POST | `/verificar-token` | Verificar validade do token |

### 👤 Usuários (`/api/users`)
| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/perfil` | Obter perfil do usuário | ✅ |
| PUT | `/perfil` | Atualizar perfil | ✅ |
| PUT | `/alterar-senha` | Alterar senha | ✅ |
| DELETE | `/perfil` | Excluir conta | ✅ |
| GET | `/favoritos` | Listar favoritos | ✅ |
| POST | `/favoritos` | Adicionar favorito | ✅ |
| DELETE | `/favoritos/:itemId` | Remover favorito | ✅ |
| GET | `/` | Listar todos os usuários | ✅ (Admin) |

**Total: 13 endpoints**

---

## 🛠️ Tecnologias e Dependências

### Core
- **Node.js** v18+ - Runtime JavaScript
- **Express** v4.18 - Framework web
- **JSON Server** v0.17 - Mock database

### Segurança
- **jsonwebtoken** v9.0 - Autenticação JWT
- **bcryptjs** v2.4 - Hash de senhas
- **express-validator** v7.0 - Validação de dados
- **cors** v2.8 - Controle de origem

### Utilitários
- **nodemailer** v6.9 - Envio de emails
- **uuid** v9.0 - Geração de IDs únicos
- **dotenv** v16.3 - Variáveis de ambiente

---

## 📝 Arquivos de Configuração

### `.env` - Variáveis de Ambiente
```env
PORT=3000
JWT_SECRET=chave-super-secreta
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=seu-email@gmail.com
```

### `.gitignore` - Arquivos Ignorados
```
node_modules/
.env
db/db.json (dados locais)
```

### `package.json` - Dependências e Scripts
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

---

