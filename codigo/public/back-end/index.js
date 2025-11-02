const jsonServer = require('json-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db', 'db.json'));
const middlewares = jsonServer.defaults();

// JWT Secret (em produção, use variável de ambiente)
const JWT_SECRET = 'sabiaa-secret-key-development';

// Aplicar middlewares padrão
server.use(cors());
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Função para carregar dados do banco
function getDb() {
    const dbPath = path.join(__dirname, 'db', 'db.json');
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

// Função para salvar dados no banco
function saveDb(data) {
    const dbPath = path.join(__dirname, 'db', 'db.json');
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Middleware para gerar token JWT
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            tipo: user.tipo 
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
    );
}

// Middleware para verificar token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// ===== ROTAS DE AUTENTICAÇÃO =====

// Login
server.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const db = getDb();
    const user = db.usuarios.find(u => u.email === email);
    
    if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const isValidPassword = bcrypt.compareSync(senha, user.senha_hash);
    
    if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = generateToken(user);
    
    // Remover senha do retorno
    const { senha_hash, ...userWithoutPassword } = user;
    
    res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        user: userWithoutPassword
    });
});

// Cadastro
server.post('/api/auth/cadastro', (req, res) => {
    const { email, senha, nome, tipo, telefone, data_nascimento, foto } = req.body;
    
    if (!email || !senha || !nome || !tipo) {
        return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    const db = getDb();
    
    // Verificar se email já existe
    const existingUser = db.usuarios.find(u => u.email === email);
    if (existingUser) {
        return res.status(409).json({ error: 'Email já cadastrado' });
    }
    
    // Criar novo usuário
    const hashedPassword = bcrypt.hashSync(senha, 10);
    const newUser = {
        id: uuidv4(),
        tipo,
        nome,
        foto: foto || "",
        data_nascimento: data_nascimento || "",
        email,
        senha_hash: hashedPassword,
        telefone: telefone || "",
        endereco: {
            cep: "",
            rua: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: ""
        },
        preferencias: {
            idioma: "pt-br",
            notificacoes: true,
            acessibilidade: false,
            tema: "claro"
        },
        cadastro_data: new Date().toISOString(),
        status: "ativo",
        favoritos: [],
        referencias_academicas: {
            [tipo]: {
                escola: "",
                serie: "",
                turma: "",
                numero_matricula: "",
                cursos_ids: [],
                quizzes_ids: [],
                tarefas_ids: []
            }
        }
    };
    
    db.usuarios.push(newUser);
    saveDb(db);
    
    const token = generateToken(newUser);
    
    // Remover senha do retorno
    const { senha_hash, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso',
        token,
        user: userWithoutPassword
    });
});

// Verificar token
server.get('/api/auth/verificar', verifyToken, (req, res) => {
    const db = getDb();
    const user = db.usuarios.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Remover senha do retorno
    const { senha_hash, ...userWithoutPassword } = user;
    
    res.json({
        success: true,
        user: userWithoutPassword
    });
});

// Recuperar senha (simplificado)
server.post('/api/auth/recuperar-senha', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    const db = getDb();
    const user = db.usuarios.find(u => u.email === email);
    
    if (!user) {
        // Por segurança, retornamos sucesso mesmo se o email não existir
        return res.json({
            success: true,
            message: 'Se o email existir, as instruções foram enviadas'
        });
    }
    
    // Gerar token de recuperação
    const recoveryToken = uuidv4();
    
    // Salvar token no banco (expiração em 1 hora)
    if (!db.recovery_tokens) {
        db.recovery_tokens = [];
    }
    
    db.recovery_tokens.push({
        email,
        token: recoveryToken,
        expires: new Date(Date.now() + 3600000).toISOString() // 1 hora
    });
    
    saveDb(db);
    
    res.json({
        success: true,
        message: 'Token de recuperação gerado',
        recovery_token: recoveryToken // Em produção, seria enviado por email
    });
});

// Alterar senha
server.post('/api/auth/alterar-senha', (req, res) => {
    const { recovery_token, nova_senha } = req.body;
    
    if (!recovery_token || !nova_senha) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }
    
    const db = getDb();
    
    // Encontrar token válido
    const tokenData = db.recovery_tokens.find(t => 
        t.token === recovery_token && 
        new Date(t.expires) > new Date()
    );
    
    if (!tokenData) {
        return res.status(400).json({ error: 'Token inválido ou expirado' });
    }
    
    // Encontrar usuário
    const user = db.usuarios.find(u => u.email === tokenData.email);
    
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Atualizar senha
    user.senha_hash = bcrypt.hashSync(nova_senha, 10);
    
    // Remover token usado
    db.recovery_tokens = db.recovery_tokens.filter(t => t.token !== recovery_token);
    
    saveDb(db);
    
    res.json({
        success: true,
        message: 'Senha alterada com sucesso'
    });
});

// ===== ROTAS DE USUÁRIO =====

// Obter perfil do usuário logado
server.get('/api/usuario/perfil', verifyToken, (req, res) => {
    const db = getDb();
    const user = db.usuarios.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Remover senha do retorno
    const { senha_hash, ...userWithoutPassword } = user;
    
    res.json({
        success: true,
        user: userWithoutPassword
    });
});

// Atualizar perfil do usuário logado
server.put('/api/usuario/perfil', verifyToken, (req, res) => {
    const db = getDb();
    const userIndex = db.usuarios.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Campos que podem ser atualizados
    const allowedFields = ['nome', 'telefone', 'data_nascimento', 'endereco', 'preferencias', 'foto'];
    
    // Atualizar apenas campos permitidos
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            db.usuarios[userIndex][field] = req.body[field];
        }
    }
    
    saveDb(db);
    
    // Remover senha do retorno
    const { senha_hash, ...userWithoutPassword } = db.usuarios[userIndex];
    
    res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        user: userWithoutPassword
    });
});

// Atualizar foto do usuário
server.patch('/api/usuarios/:id/foto', verifyToken, (req, res) => {
    const { foto } = req.body;
    const userId = req.params.id;
    
    if (!foto) {
        return res.status(400).json({ error: 'URL da foto é obrigatória' });
    }
    
    // Verificar se o usuário está tentando atualizar sua própria foto
    if (req.user.id !== userId) {
        return res.status(403).json({ error: 'Você só pode atualizar sua própria foto' });
    }
    
    const db = getDb();
    const userIndex = db.usuarios.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Atualizar foto
    db.usuarios[userIndex].foto = foto;
    
    saveDb(db);
    
    // Remover senha do retorno
    const { senha_hash, ...userWithoutPassword } = db.usuarios[userIndex];
    
    res.json({
        success: true,
        message: 'Foto atualizada com sucesso',
        user: userWithoutPassword
    });
});

// Health check
server.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Sabiaa JSON Server está funcionando',
        timestamp: new Date().toISOString()
    });
});

// Usar as rotas padrão do JSON Server para outras operações
server.use('/api', router);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Sabiaa JSON Server está rodando na porta ${PORT}`);
    console.log(`� Dashboard: http://localhost:${PORT}`);
    console.log(`� Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`� User API: http://localhost:${PORT}/api/usuario`);
});