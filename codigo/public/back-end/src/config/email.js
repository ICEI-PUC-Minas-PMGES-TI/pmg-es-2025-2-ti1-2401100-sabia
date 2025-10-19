// src/config/email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Configuração do transporter de email
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'seu-email@gmail.com',
    pass: process.env.SMTP_PASS || 'sua-senha-app'
  }
});

/**
 * Envia email de recuperação de senha
 * @param {string} email - Email do destinatário
 * @param {string} nome - Nome do usuário
 * @param {string} codigo - Código de recuperação
 * @param {string} token - Token de recuperação
 */
const enviarEmailRecuperacao = async (email, nome, codigo, token) => {
  const linkRecuperacao = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recuperar-senha?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Recuperação de Senha - Sabiaa',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Sabiaa</h1>
          <p style="color: white; margin: 5px 0;">Plataforma Educacional</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Recuperação de Senha</h2>
          <p style="color: #666; font-size: 16px;">Olá, <strong>${nome}</strong>!</p>
          <p style="color: #666; font-size: 14px;">Você solicitou a recuperação de senha da sua conta no Sabiaa.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Seu código de verificação:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4CAF50; font-family: 'Courier New', monospace;">
              ${codigo}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center;">Ou clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${linkRecuperacao}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Recuperar Senha
            </a>
          </div>
          
          <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">⏰ Este código expira em 15 minutos.</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">🔒 Se você não solicitou esta recuperação, ignore este email.</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">❓ Caso tenha dúvidas, entre em contato com o suporte.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 Sabiaa - Plataforma Educacional</p>
        </div>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Envia email de boas-vindas
 * @param {string} email - Email do destinatário
 * @param {string} nome - Nome do usuário
 * @param {string} tipo - Tipo de usuário
 */
const enviarEmailBoasVindas = async (email, nome, tipo) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Bem-vindo ao Sabiaa! 🎓',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Bem-vindo ao Sabiaa! 🎓</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <p style="color: #666; font-size: 16px;">Olá, <strong>${nome}</strong>!</p>
          <p style="color: #666; font-size: 14px;">Seu cadastro como <strong>${tipo}</strong> foi realizado com sucesso!</p>
          
          <div style="background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50; border-radius: 5px;">
            <h3 style="color: #4CAF50; margin-top: 0;">O que você pode fazer agora:</h3>
            <ul style="color: #666;">
              ${tipo === 'aluno' ? `
                <li>Explorar cursos e vídeo-aulas</li>
                <li>Realizar quizzes interativos</li>
                <li>Acompanhar seu desempenho</li>
                <li>Interagir com professores</li>
              ` : tipo === 'professor' ? `
                <li>Criar e gerenciar aulas</li>
                <li>Elaborar quizzes</li>
                <li>Acompanhar turmas</li>
                <li>Gerar relatórios</li>
              ` : `
                <li>Gerenciar usuários</li>
                <li>Visualizar relatórios</li>
                <li>Administrar a plataforma</li>
              `}
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">Estamos felizes em tê-lo conosco na jornada de transformação da educação brasileira!</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 Sabiaa - Democratizando o acesso à educação de qualidade</p>
        </div>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  enviarEmailRecuperacao,
  enviarEmailBoasVindas
};
