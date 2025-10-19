/**
 * SABIAA - Sistema de Upload para Firebase Storage
 * Funções globais para upload de imagens
 */

class SabiaUpload {
    constructor() {
        this.firebaseConfig = window.SABIAA_CONFIG?.FIREBASE;
        this.storage = null;
        this.initialized = false;
    }

    /**
     * Inicializar Firebase
     */
    async init() {
        try {
            // Verificar se Firebase já está carregado
            if (typeof firebase === 'undefined') {
                await this.loadFirebaseSDK();
            }

            // Inicializar Firebase se ainda não foi
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }

            this.storage = firebase.storage();
            this.initialized = true;
            console.log('Firebase Storage inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar Firebase:', error);
            throw error;
        }
    }

    /**
     * Carregar SDK do Firebase dinamicamente
     */
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            // Firebase App (core)
            const firebaseApp = document.createElement('script');
            firebaseApp.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
            firebaseApp.onload = () => {
                // Firebase Storage
                const firebaseStorage = document.createElement('script');
                firebaseStorage.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';
                firebaseStorage.onload = () => resolve();
                firebaseStorage.onerror = () => reject(new Error('Erro ao carregar Firebase Storage'));
                document.head.appendChild(firebaseStorage);
            };
            firebaseApp.onerror = () => reject(new Error('Erro ao carregar Firebase App'));
            document.head.appendChild(firebaseApp);
        });
    }

    /**
     * Upload de foto de perfil
     * @param {File} file - Arquivo de imagem
     * @param {string} userId - ID do usuário
     * @param {function} onProgress - Callback de progresso (opcional)
     * @returns {Promise<string>} URL da imagem
     */
    async uploadProfilePhoto(file, userId, onProgress = null) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Validar arquivo
            this.validateImageFile(file);

            // Criar nome único para o arquivo
            const fileName = `profile_photos/${userId}_${Date.now()}.${this.getFileExtension(file.name)}`;
            
            // Referência do storage
            const storageRef = this.storage.ref(fileName);
            
            // Upload task
            const uploadTask = storageRef.put(file, {
                contentType: file.type,
                customMetadata: {
                    userId: userId,
                    uploadDate: new Date().toISOString(),
                    originalName: file.name
                }
            });

            // Monitorar progresso
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Progresso
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) {
                            onProgress(progress);
                        }
                        console.log(`Upload: ${progress.toFixed(1)}%`);
                    },
                    (error) => {
                        // Erro
                        console.error('Erro no upload:', error);
                        reject(error);
                    },
                    async () => {
                        // Sucesso - obter URL de download
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            console.log('Upload concluído:', downloadURL);
                            resolve(downloadURL);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });

        } catch (error) {
            console.error('Erro no upload da foto:', error);
            throw error;
        }
    }

    /**
     * Validar arquivo de imagem
     * @param {File} file - Arquivo a ser validado
     */
    validateImageFile(file) {
        // Verificar se é arquivo
        if (!file || !(file instanceof File)) {
            throw new Error('Arquivo inválido');
        }

        // Verificar tipo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Tipo de arquivo não suportado. Use: JPEG, PNG ou WebP');
        }

        // Verificar tamanho (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('Arquivo muito grande. Máximo: 5MB');
        }

        // Verificar dimensões (opcional - pode ser implementado)
        return true;
    }

    /**
     * Obter extensão do arquivo
     * @param {string} filename - Nome do arquivo
     * @returns {string} Extensão
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Renomear foto com ID real do usuário
     * @param {string} tempPhotoUrl - URL temporária da foto
     * @param {string} realUserId - ID real do usuário
     * @returns {Promise<string>} Nova URL da foto
     */
    async movePhotoToRealUser(tempPhotoUrl, realUserId) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Obter referência da foto temporária
            const tempRef = this.storage.refFromURL(tempPhotoUrl);
            
            // Baixar dados da foto
            const downloadURL = await tempRef.getDownloadURL();
            const response = await fetch(downloadURL);
            const blob = await response.blob();
            
            // Criar nova referência com ID real
            const extension = tempPhotoUrl.split('.').pop().split('?')[0];
            const newFileName = `profile_photos/${realUserId}_${Date.now()}.${extension}`;
            const newRef = this.storage.ref(newFileName);
            
            // Upload com novo nome
            await newRef.put(blob, {
                contentType: blob.type,
                customMetadata: {
                    userId: realUserId,
                    uploadDate: new Date().toISOString(),
                    movedFrom: 'temp_upload'
                }
            });
            
            // Obter nova URL
            const newUrl = await newRef.getDownloadURL();
            
            // Deletar arquivo temporário
            await tempRef.delete();
            
            console.log('Foto movida com sucesso:', newUrl);
            return newUrl;
            
        } catch (error) {
            console.error('Erro ao mover foto:', error);
            // Retornar URL original em caso de erro
            return tempPhotoUrl;
        }
    }

    /**
     * Deletar foto antiga (quando usuário atualiza perfil)
     * @param {string} photoUrl - URL da foto a ser deletada
     */
    async deletePhoto(photoUrl) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Extrair caminho do arquivo da URL
            const photoRef = this.storage.refFromURL(photoUrl);
            await photoRef.delete();
            console.log('Foto antiga deletada com sucesso');
        } catch (error) {
            console.error('Erro ao deletar foto antiga:', error);
            // Não falhar o processo por causa disso
        }
    }

    /**
     * Redimensionar imagem antes do upload (cliente)
     * @param {File} file - Arquivo original
     * @param {number} maxWidth - Largura máxima
     * @param {number} maxHeight - Altura máxima
     * @param {number} quality - Qualidade (0-1)
     * @returns {Promise<Blob>} Imagem redimensionada
     */
    async resizeImage(file, maxWidth = 400, maxHeight = 400, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calcular dimensões mantendo proporção
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                // Redimensionar no canvas
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Converter para blob
                canvas.toBlob(resolve, file.type, quality);
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}

// Instanciar globalmente
const sabiaUpload = new SabiaUpload();

// Disponibilizar globalmente
window.sabiaUpload = sabiaUpload;

/**
 * Função auxiliar para preview de imagem
 * @param {File} file - Arquivo de imagem
 * @param {HTMLElement} previewElement - Elemento para mostrar preview
 */
function showImagePreview(file, previewElement) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewElement.tagName === 'IMG') {
                previewElement.src = e.target.result;
                previewElement.style.display = 'block';
            } else {
                previewElement.style.backgroundImage = `url(${e.target.result})`;
                previewElement.style.backgroundSize = 'cover';
                previewElement.style.backgroundPosition = 'center';
            }
            
            // Adicionar classe para indicar que tem imagem
            previewElement.closest('.photo-preview')?.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Definir placeholder padrão (logo SABIAA)
 * @param {HTMLElement} previewElement - Elemento para mostrar placeholder
 */
function setPlaceholderImage(previewElement) {
    const placeholderSrc = window.SABIAA_CONFIG?.UPLOAD?.placeholderImage || '../../assets/images/logos/logo_simbolo_azul.png';
    
    if (previewElement.tagName === 'IMG') {
        previewElement.src = placeholderSrc;
        previewElement.style.display = 'block';
    } else {
        previewElement.style.backgroundImage = `url(${placeholderSrc})`;
        previewElement.style.backgroundSize = 'contain';
        previewElement.style.backgroundRepeat = 'no-repeat';
        previewElement.style.backgroundPosition = 'center';
    }
    
    // Remover classe de imagem personalizada
    previewElement.closest('.photo-preview')?.classList.remove('has-image');
}

/**
 * Remover imagem e voltar ao placeholder
 * @param {HTMLElement} previewElement - Elemento do preview
 */
function removePreviewImage(previewElement) {
    setPlaceholderImage(previewElement);
    
    // Limpar input de arquivo
    const container = previewElement.closest('.photo-upload-container');
    const fileInput = container?.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Disponibilizar funções globalmente
window.showImagePreview = showImagePreview;
window.setPlaceholderImage = setPlaceholderImage;
window.removePreviewImage = removePreviewImage;