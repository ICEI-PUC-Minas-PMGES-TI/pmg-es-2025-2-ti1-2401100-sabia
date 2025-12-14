const jsonServer = require('json-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const htmlPdf = require('html-pdf-node');


const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db', 'db.json'));
// Use json-server defaults (we'll register our static middleware before them)
const middlewares = jsonServer.defaults();

// JWT Secret (em produção, use variável de ambiente)
const JWT_SECRET = 'sabiaa-secret-key-development';

// Aplicar middlewares padrão
server.use(cors());

// Servir arquivos estáticos da pasta public na raiz do servidor (antes do json-server)
const express = require('express');
const publicPath = path.join(__dirname, '..');
server.use(express.static(publicPath));

// Ensure root always serves our index (fallback handled inside)
server.get('/', (req, res, next) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    const fallback = path.join(publicPath, 'modules', 'home', 'index.html');
    if (fs.existsSync(fallback)) return res.sendFile(fallback);
    next();
});

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

function gerarHTMLCertificado(certificado) {
    try {
        const templatePath = path.join(__dirname, 'templates', 'certificado.html');
        let html = fs.readFileSync(templatePath, 'utf8');
    
        const logoPath = path.join(__dirname, '..', 'assets', 'images', 'logos', 'logo_bege_texto_lateral.png');
        let logoHtml = '';
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoBase64 = logoBuffer.toString('base64');
            logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="SABIAA" class="sabiaa-logo">`;
        } catch (logoError) {
            console.warn('Logo não encontrada, usando fallback');
            logoHtml = '<div style="font-size: 28px; font-weight: 700; letter-spacing: 2px; margin-bottom: 10px; color: white;">SABIAA</div>';
        }
        
        const db = getDb();
        const usuario = db.usuarios.find(u => u.id === certificado.usuario_id);
        const usuarioNome = usuario ? usuario.nome : (certificado.usuario_nome || 'Nome não encontrado');
        
        html = html.replace(/{{usuario_nome}}/g, usuarioNome);
        html = html.replace(/{{curso_titulo}}/g, certificado.dados_curso?.titulo || 'Curso não especificado');
        html = html.replace(/{{instrutor}}/g, certificado.dados_curso?.instrutor || 'Instrutor não especificado');
        html = html.replace(/{{carga_horaria}}/g, certificado.carga_horaria_curso || certificado.dados_curso?.carga_horaria || '0');
        html = html.replace(/{{nota_final}}/g, (certificado.nota_final || 0).toFixed(1));
        html = html.replace(/{{data_conclusao}}/g, new Date(certificado.data_conclusao_curso || certificado.data_emissao).toLocaleDateString('pt-BR'));
        html = html.replace(/{{data_emissao}}/g, new Date(certificado.data_emissao).toLocaleDateString('pt-BR'));
        html = html.replace(/{{categoria}}/g, certificado.dados_curso?.categoria || 'Categoria não especificada');
        html = html.replace(/{{nivel}}/g, certificado.dados_curso?.nivel || 'Nível não especificado');
        html = html.replace(/{{token_validacao}}/g, certificado.token_validacao);
        html = html.replace(/{{logo_html}}/g, logoHtml);
        
        return html;
    } catch (error) {
        console.error('Erro ao gerar HTML do certificado:', error);
        throw new Error('Erro ao gerar template do certificado');
    }
}

// Middleware para verificar token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];

    if (token.startsWith('user_')) {
        console.log('🔐 Token de usuário real detectado');
        try {
            const parts = token.split('_');
            if (parts.length >= 2) {
                const userDataBase64 = parts[1];
                const userDataString = Buffer.from(userDataBase64, 'base64').toString('utf8');
                const userData = JSON.parse(userDataString);
                
                req.user = {
                    id: userData.id,
                    email: userData.email,
                    nome: userData.nome,
                    tipo: userData.tipo
                };
                
                console.log('✅ Token de usuário real válido para:', userData.nome, '(' + userData.email + ')');
                return next();
            }
        } catch (error) {
            console.log('❌ Erro ao processar token de usuário:', error);
            return res.status(401).json({ error: 'Token de usuário inválido' });
        }
    }
    
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
server.get('/api/certificados/cursos-disponiveis', verifyToken, (req, res) => {
    try {
        const db = getDb();
        const usuarioId = req.user.id;
        
        const progressosConcluidos = db.progresso_cursos.filter(p => 
            p.usuario_id === usuarioId && p.status === 'concluido'
        );
        
        const cursosDisponiveis = progressosConcluidos.map(progresso => {
            const curso = db.cursos.find(c => c.id === progresso.curso_id);
            if (!curso) return null;
            
            const certificadoExistente = db.certificados.find(cert => 
                cert.usuario_id === usuarioId && cert.curso_id === progresso.curso_id
            );
            
            if (certificadoExistente) return null;
            
            return {
                id: curso.id,
                titulo: curso.titulo,
                instrutor: curso.instrutor,
                carga_horaria: curso.carga_horaria,
                categoria: curso.categoria,
                nivel: curso.nivel,
                total_aulas: curso.total_aulas || progresso.aulas_concluidas?.length || 10,
                progresso: {
                    aulas_assistidas: progresso.aulas_concluidas?.length || curso.total_aulas || 10,
                    data_conclusao: progresso.data_conclusao,
                    nota_final: progresso.nota_final || 8.5
                }
            };
        }).filter(Boolean);
        
        res.json(cursosDisponiveis);
        
    } catch (error) {
        console.error('Erro ao buscar cursos disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

server.post('/api/certificados/gerar', verifyToken, (req, res) => {
    try {
        const { curso_id } = req.body;
        const usuarioId = req.user.id;
        
        if (!curso_id) {
            return res.status(400).json({ error: 'ID do curso é obrigatório' });
        }
        
        const db = getDb();
        
        const usuario = db.usuarios.find(u => u.id === usuarioId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        const curso = db.cursos.find(c => c.id === curso_id);
        if (!curso) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }
        
        // localizar registro de progresso para o usuário/curso (independente do status)
        let progresso = db.progresso_cursos.find(p => p.usuario_id === usuarioId && p.curso_id === curso_id);

        if (!progresso) {
            return res.status(400).json({ 
                error: 'Inscrição/progresso não encontrado para este usuário e curso' 
            });
        }

        // normalizar fontes de porcentagem: pode ser 'progresso_porcentagem' ou 'progresso'
        const porcentagem = Number(progresso.progresso_porcentagem ?? progresso.progresso ?? 0);

        // se porcentagem menor que 100, bloqueia geração
        if (porcentagem < 100) {
            return res.status(400).json({ 
                error: 'Você precisa concluir o curso antes de gerar o certificado' 
            });
        }

        // se o registro existe mas não está marcado como concluído, marcar agora e persistir
        if (!(progresso.status && String(progresso.status).toLowerCase().includes('conclu'))) {
            progresso.status = 'concluido';
            if (!progresso.data_conclusao) {
                progresso.data_conclusao = new Date().toISOString();
            }
            // salvar alterações no banco
            saveDb(db);
            console.log('Progresso marcado como concluído automaticamente antes de gerar certificado:', progresso.id);
        }
        
        const certificadoExistente = db.certificados.find(cert => 
            cert.usuario_id === usuarioId && cert.curso_id === curso_id
        );
        
        if (certificadoExistente) {
            return res.status(400).json({ 
                error: 'Certificado já foi emitido para este curso',
                certificado_id: certificadoExistente.id
            });
        }

        const tokenValidacao = uuidv4() + '-' + Date.now();
        
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
        
        if (!db.certificados) {
            db.certificados = [];
        }
        db.certificados.push(certificado);
        
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

server.get('/api/certificados/validar/:token', (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ error: 'Token é obrigatório' });
        }
        
        const db = getDb();
        
        const tokenCertificado = db.tokens_certificados.find(t => 
            t.token === token && t.status === 'ativo'
        );
        
        if (!tokenCertificado) {
            return res.status(404).json({ 
                error: 'Certificado não encontrado ou token inválido',
                valido: false
            });
        }
        
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

server.get('/api/certificados/meus-certificados', verifyToken, (req, res) => {
    try {
        const db = getDb();
        const usuarioId = req.user.id;
        
        const certificados = db.certificados.filter(c => 
            c.usuario_id === usuarioId && c.status === 'ativo'
        );
        
        const certificadosFormatados = certificados.map(cert => ({
            id: cert.id,
            curso_titulo: cert.dados_curso?.titulo || 'Curso não especificado',
            instrutor: cert.dados_curso?.instrutor || 'Instrutor não especificado',
            carga_horaria: cert.carga_horaria_curso || cert.dados_curso?.carga_horaria || 0,
            categoria: cert.dados_curso?.categoria || 'Categoria não especificada',
            nivel: cert.dados_curso?.nivel || 'Nível não especificado',
            data_emissao: cert.data_emissao,
            data_conclusao: cert.data_conclusao_curso || cert.data_emissao,
            nota_final: cert.nota_final || 0,
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

server.get('/api/certificados/:id/pdf', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const db = getDb();
        
        const certificado = db.certificados.find(c => 
            c.id === id && 
            c.usuario_id === usuarioId && 
            c.status === 'ativo'
        );
        
        if (!certificado) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }
        
        console.log('🔄 Gerando PDF para certificado:', id);
        
        const html = gerarHTMLCertificado(certificado);
        
        const options = {
            format: 'A4',
            orientation: 'landscape',
            border: {
                top: '0.5cm',
                right: '0.5cm',
                bottom: '0.5cm',
                left: '0.5cm'
            },
            type: 'pdf',
            quality: '75'
        };
        
        const pdfBuffer = await htmlPdf.generatePdf({ content: html }, options);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificado_${certificado.dados_curso.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.send(pdfBuffer);
        
        console.log('✅ PDF gerado e enviado com sucesso');
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

server.get('/api/certificados/:id/view', verifyToken, (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const db = getDb();
        
        const certificado = db.certificados.find(c => 
            c.id === id && 
            c.usuario_id === usuarioId && 
            c.status === 'ativo'
        );
        
        if (!certificado) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }
        
        const html = gerarHTMLCertificado(certificado);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
        
    } catch (error) {
        console.error('Erro ao visualizar certificado:', error);
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

// Rota raiz - servir a homepage diretamente
server.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    // fallback para página de módulos/home
    const fallback = path.join(publicPath, 'modules', 'home', 'index.html');
    if (fs.existsSync(fallback)) return res.sendFile(fallback);
    res.status(404).send('Homepage não encontrada');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀  SABIAA - Plataforma Educacional');
    console.log('='.repeat(60));
    console.log(`\n✅  Servidor rodando na porta ${PORT}\n`);
    console.log('📍  URLs principais:');
    console.log(`   🏠 Homepage:   http://localhost:${PORT}/codigo/public/modules/home/index.html`);
    console.log(`   🔐 Login:      http://localhost:${PORT}/codigo/public/modules/auth/login.html`);
    console.log(`   📊 Dashboard:  http://localhost:${PORT}/codigo/public/modules/dashboard/index.html`);
    console.log(`\n📡  API Endpoints:`);
    console.log(`   🔑 Auth:       http://localhost:${PORT}/api/auth`);
    console.log(`   👤 Usuário:    http://localhost:${PORT}/api/usuario`);
    console.log(`   🏆 Certificados: http://localhost:${PORT}/api/certificados`);
    console.log(`   💾 Banco:      http://localhost:${PORT}/api`);
    console.log('\n' + '='.repeat(60) + '\n');
});