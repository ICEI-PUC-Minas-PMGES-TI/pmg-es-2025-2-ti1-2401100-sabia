// src/validators/auth.validator.js
const { body } = require('express-validator');

const cadastroValidator = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter letras maiúsculas, minúsculas e números'),
  
  body('nome')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2 })
    .withMessage('Nome deve ter no mínimo 2 caracteres'),
  
  body('sobrenome')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Sobrenome deve ter no mínimo 2 caracteres'),
  
  body('tipo')
    .isIn(['aluno', 'professor', 'administrador'])
    .withMessage('Tipo de usuário inválido'),
  
  body('plataforma')
    .optional()
    .isIn(['cursos', 'educacao'])
    .withMessage('Plataforma inválida'),
  
  body('data_nascimento')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento inválida')
    .custom((value) => {
      if (!value) return true; // Se não foi enviado, é válido
      const hoje = new Date();
      const nascimento = new Date(value);
      const idade = hoje.getFullYear() - nascimento.getFullYear();
      if (idade < 5 || idade > 120) {
        throw new Error('Data de nascimento inválida');
      }
      return true;
    }),
  
  body('genero')
    .optional()
    .isIn(['masculino', 'feminino', 'nao-binario', 'outro', 'prefiro-nao-informar'])
    .withMessage('Gênero inválido. Opções: masculino, feminino, nao-binario, outro, prefiro-nao-informar'),
  
  body('telefone')
    .optional()
    .matches(/^[0-9\s\-\(\)\+]+$/)
    .withMessage('Telefone inválido'),
  
  body('foto')
    .optional()
    .isURL()
    .withMessage('URL da foto inválida')
];

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

const recuperarSenhaValidator = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
];

const alterarSenhaValidator = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),
  
  body('codigo')
    .isLength({ min: 6, max: 6 })
    .withMessage('Código deve ter 6 dígitos')
    .isNumeric()
    .withMessage('Código deve conter apenas números'),
  
  body('nova_senha')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter no mínimo 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter letras maiúsculas, minúsculas e números')
];

const alterarSenhaLogadoValidator = [
  body('senha_atual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  
  body('nova_senha')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter no mínimo 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter letras maiúsculas, minúsculas e números')
];

module.exports = {
  cadastroValidator,
  loginValidator,
  recuperarSenhaValidator,
  alterarSenhaValidator,
  alterarSenhaLogadoValidator
};
