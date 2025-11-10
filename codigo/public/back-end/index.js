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

// Verificar token de recuperação
server.post('/api/auth/verificar-token-recuperacao', (req, res) => {
    const { recovery_token } = req.body;
    
    if (!recovery_token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
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
    
    res.json({
        success: true,
        message: 'Token válido',
        email: tokenData.email
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

// ===== ROTAS DE CERTIFICADOS =====

// Listar cursos disponíveis para certificado
server.get('/api/certificados/cursos-disponiveis', verifyToken, (req, res) => {
    try {
        const db = getDb();
        const usuarioId = req.user.id;
        
        // Buscar progressos do usuário que estão concluídos
        const progressosConcluidos = db.progresso_cursos.filter(p => 
            p.usuario_id === usuarioId && p.status === 'concluido'
        );
        
        // Buscar detalhes dos cursos concluídos
        const cursosDisponiveis = progressosConcluidos.map(progresso => {
            const curso = db.cursos.find(c => c.id === progresso.curso_id);
            if (!curso) return null;
            
            // Verificar se já existe certificado emitido
            const certificadoExistente = db.certificados.find(cert => 
                cert.usuario_id === usuarioId && cert.curso_id === progresso.curso_id
            );
            
            return {
                curso_id: curso.id,
                titulo: curso.titulo,
                instrutor: curso.instrutor,
                carga_horaria: curso.carga_horaria,
                categoria: curso.categoria,
                nivel: curso.nivel,
                data_conclusao: progresso.data_conclusao,
                nota_final: progresso.nota_final,
                certificado_emitido: !!certificadoExistente,
                certificado_id: certificadoExistente?.id || null
            };
        }).filter(Boolean);
        
        res.json({
            success: true,
            cursos_disponiveis: cursosDisponiveis,
            total: cursosDisponiveis.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar cursos disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Gerar certificado
server.post('/api/certificados/gerar', verifyToken, (req, res) => {
    try {
        const { curso_id } = req.body;
        const usuarioId = req.user.id;
        
        if (!curso_id) {
            return res.status(400).json({ error: 'ID do curso é obrigatório' });
        }
        
        const db = getDb();
        
        // Verificar se o usuário existe
        const usuario = db.usuarios.find(u => u.id === usuarioId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar se o curso existe
        const curso = db.cursos.find(c => c.id === curso_id);
        if (!curso) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }
        
        // Verificar se o usuário concluiu o curso
        const progresso = db.progresso_cursos.find(p => 
            p.usuario_id === usuarioId && 
            p.curso_id === curso_id && 
            p.status === 'concluido'
        );
        
        if (!progresso) {
            return res.status(400).json({ 
                error: 'Você precisa concluir o curso antes de gerar o certificado' 
            });
        }
        
        // Verificar se já existe certificado
        const certificadoExistente = db.certificados.find(cert => 
            cert.usuario_id === usuarioId && cert.curso_id === curso_id
        );
        
        if (certificadoExistente) {
            return res.status(400).json({ 
                error: 'Certificado já foi emitido para este curso',
                certificado_id: certificadoExistente.id
            });
        }
        
        // Gerar token de validação único
        const tokenValidacao = uuidv4() + '-' + Date.now();
        
        // Criar certificado
        const certificado = {
            id: uuidv4(),
            usuario_id: usuarioId,
            curso_id: curso_id,
            token_validacao: tokenValidacao,
            data_emissao: new Date().toISOString(),
            dados_usuario: {
                nome: usuario.nome,
                email: usuario.email,
                id: usuario.id
            },
            dados_curso: {
                titulo: curso.titulo,
                instrutor: curso.instrutor,
                carga_horaria: curso.carga_horaria,
                categoria: curso.categoria,
                nivel: curso.nivel
            },
            dados_conclusao: {
                data_inicio: progresso.data_inicio,
                data_conclusao: progresso.data_conclusao,
                nota_final: progresso.nota_final,
                progresso_porcentagem: progresso.progresso_porcentagem
            },
            status: 'ativo'
        };
        
        // Salvar certificado
        if (!db.certificados) {
            db.certificados = [];
        }
        db.certificados.push(certificado);
        
        // Criar token de validação separado para consultas públicas
        const tokenCertificado = {
            id: uuidv4(),
            token: tokenValidacao,
            certificado_id: certificado.id,
            usuario_nome: usuario.nome,
            curso_titulo: curso.titulo,
            data_emissao: certificado.data_emissao,
            data_conclusao: progresso.data_conclusao,
            carga_horaria: curso.carga_horaria,
            nota_final: progresso.nota_final,
            status: 'ativo',
            criado_em: new Date().toISOString()
        };
        
        if (!db.tokens_certificados) {
            db.tokens_certificados = [];
        }
        db.tokens_certificados.push(tokenCertificado);
        
        saveDb(db);
        
        res.status(201).json({
            success: true,
            message: 'Certificado gerado com sucesso',
            certificado: {
                id: certificado.id,
                token_validacao: tokenValidacao,
                data_emissao: certificado.data_emissao,
                curso_titulo: curso.titulo,
                usuario_nome: usuario.nome,
                nota_final: progresso.nota_final,
                carga_horaria: curso.carga_horaria
            }
        });
        
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Validar certificado por token (rota pública)
server.get('/api/certificados/validar/:token', (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ error: 'Token é obrigatório' });
        }
        
        const db = getDb();
        
        // Buscar token de certificado
        const tokenCertificado = db.tokens_certificados.find(t => 
            t.token === token && t.status === 'ativo'
        );
        
        if (!tokenCertificado) {
            return res.status(404).json({ 
                error: 'Certificado não encontrado ou token inválido',
                valido: false
            });
        }
        
        // Buscar certificado completo
        const certificado = db.certificados.find(c => 
            c.id === tokenCertificado.certificado_id && c.status === 'ativo'
        );
        
        if (!certificado) {
            return res.status(404).json({ 
                error: 'Certificado não encontrado',
                valido: false
            });
        }
        
        res.json({
            success: true,
            valido: true,
            certificado: {
                id: certificado.id,
                usuario_nome: certificado.dados_usuario.nome,
                curso_titulo: certificado.dados_curso.titulo,
                instrutor: certificado.dados_curso.instrutor,
                carga_horaria: certificado.dados_curso.carga_horaria,
                categoria: certificado.dados_curso.categoria,
                nivel: certificado.dados_curso.nivel,
                data_emissao: certificado.data_emissao,
                data_conclusao: certificado.dados_conclusao.data_conclusao,
                nota_final: certificado.dados_conclusao.nota_final,
                token_validacao: token
            }
        });
        
    } catch (error) {
        console.error('Erro ao validar certificado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar certificados do usuário
server.get('/api/certificados/meus-certificados', verifyToken, (req, res) => {
    try {
        const db = getDb();
        const usuarioId = req.user.id;
        
        // Buscar certificados do usuário
        const certificados = db.certificados.filter(c => 
            c.usuario_id === usuarioId && c.status === 'ativo'
        );
        
        const certificadosFormatados = certificados.map(cert => ({
            id: cert.id,
            curso_titulo: cert.dados_curso.titulo,
            instrutor: cert.dados_curso.instrutor,
            carga_horaria: cert.dados_curso.carga_horaria,
            categoria: cert.dados_curso.categoria,
            nivel: cert.dados_curso.nivel,
            data_emissao: cert.data_emissao,
            data_conclusao: cert.dados_conclusao.data_conclusao,
            nota_final: cert.dados_conclusao.nota_final,
            token_validacao: cert.token_validacao
        }));
        
        res.json({
            success: true,
            certificados: certificadosFormatados,
            total: certificadosFormatados.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar certificados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
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