export const translations = {
  en: {
    // Header
    'header.signIn': 'Sign in',
    'header.signOut': 'Sign out',
    
    // Hero
    'hero.title': 'Transcribe your audio for free',
    'hero.subtitle': 'Professional transcription with speaker identification. Up to 1 GB, up to 2 hours. Powered by Voxtral (Mistral AI)',
    
    // Upload
    'upload.dropzone': 'Drop your audio file here',
    'upload.or': 'or',
    'upload.browse': 'Browse files',
    'upload.formats': 'MP3, WAV, M4A, FLAC, OGG (up to 1 GB, max 2h)',
    'upload.speakerLanguage': 'Speaker language',
    'upload.speakerLanguageAuto': 'Automatic detection',
    'upload.speakerLanguageHint':
      'If you know the language, selecting it usually improves transcription quality.',
    
    // Progress
    'progress.uploading': 'Uploading',
    'progress.processing': 'Processing',
    'progress.transcriptionLanguage': 'Transcription language',
    'progress.transcribing': 'Transcribing with Voxtral...',
    
    // Error
    'error.title': 'Transcription failed',
    'error.tryAgain': 'Try again',
    
    // Transcript viewer
    'transcript.title': 'Transcription',
    'transcript.inputLanguage': 'Your selection',
    'transcript.detectedLanguage': 'Detected',
    'transcript.preview': 'Preview',
    'transcript.speakers': 'Speakers',
    'transcript.plain': 'Plain',
    'transcript.segments': 'Segments',
    'transcript.audio': 'Audio',
    'transcript.transcriptionTime': 'Transcription',
    'transcript.cost': 'Cost',
    'transcript.copy': 'Copy',
    'transcript.copied': 'Copied!',
    'transcript.downloadTxt': 'TXT',
    'transcript.downloadJson': 'JSON',
    'transcript.withSpeakers': 'With Speakers',
    'transcript.noSegments': 'Segment-level timing is not available for this transcription.',
    
    // Auth CTA
    'auth.cta.title': 'Sign in for free',
    'auth.cta.description': 'Sign in to view the full transcription, copy text and download files.',
    'auth.cta.button': 'Sign in',
    
    // Auth modal
    'auth.modal.signIn': 'Sign in',
    'auth.modal.signUp': 'Create account',
    'auth.modal.signInSubtitle': 'Sign in to your account',
    'auth.modal.signUpSubtitle': 'Sign up to access your transcriptions',
    'auth.modal.continueWithGoogle': 'Continue with Google',
    'auth.modal.or': 'or',
    'auth.modal.email': 'Email',
    'auth.modal.password': 'Password',
    'auth.modal.signInButton': 'Sign in',
    'auth.modal.signUpButton': 'Sign up',
    'auth.modal.alreadyAccount': 'Already have an account?',
    'auth.modal.noAccount': "Don't have an account?",
    'auth.modal.checkEmail': 'Check your email to confirm your registration!',
    'auth.modal.forgotPassword': 'Forgot password?',
    
    // Forgot Password page
    'auth.forgotPassword.title': 'Reset your password',
    'auth.forgotPassword.subtitle': 'Enter your email and we\'ll send you a reset link',
    'auth.forgotPassword.sendButton': 'Send reset link',
    'auth.forgotPassword.emailSent': 'Check your email! We\'ve sent you a link to reset your password.',
    'auth.forgotPassword.backToSignIn': 'Back to sign in',
    'auth.forgotPassword.backToHome': 'Back to home',
    'auth.forgotPassword.expiredLink': 'This link has expired. Please request a new one.',
    
    // Reset Password page
    'auth.resetPassword.title': 'Create new password',
    'auth.resetPassword.subtitle': 'Enter your new password below',
    'auth.resetPassword.newPassword': 'New password',
    'auth.resetPassword.confirmPassword': 'Confirm password',
    'auth.resetPassword.resetButton': 'Reset password',
    'auth.resetPassword.success': 'Your password has been reset successfully!',
    'auth.resetPassword.redirecting': 'Redirecting to home...',
    'auth.resetPassword.passwordMismatch': 'Passwords do not match',
    'auth.resetPassword.passwordTooShort': 'Password must be at least 6 characters',
    'auth.resetPassword.invalidLink': 'Invalid or expired link',
    'auth.resetPassword.invalidLinkDescription': 'This password reset link is invalid or has expired. Please request a new one.',
    'auth.resetPassword.requestNewLink': 'Request new link',
    
    // Features
    'features.speakers.title': 'Speaker Detection',
    'features.speakers.description': 'Automatic speaker diarization',
    'features.languages.title': '99+ Languages',
    'features.languages.description': 'Auto language detection',
    'features.fast.title': 'Fast & Accurate',
    'features.fast.description': 'Powered by Voxtral',
    
    // Footer
    'footer.text': 'OpenScribe - Transcription, collaborative workshops & qualitative CSV analysis for researchers, designers, journalists & citizens',
    
    // Privacy notice
    'privacy.notice': 'Audio files are sent to Mistral AI servers for transcription. They may use this data to improve their models. No files are permanently stored by this site.',
    
    // Upload errors
    'upload.invalidFormat': 'Unsupported file format. Voxtral only accepts: MP3, WAV, M4A, FLAC, OGG',
    'upload.fileTooLarge': 'File too large. Maximum size: {maxSize}',
    'upload.tooLong': 'Audio too long. Maximum duration: {maxDuration}',
    
    // Actions
    'actions.transcribeAnother': 'Transcribe another file',
    
    // Feedback
    'feedback.button': 'Feedback',
    'feedback.title': 'Send us feedback',
    'feedback.subtitle': '❓ Question, 💡 idea, ⚠️ problem or 💬 other — help us improve!',
    'feedback.message': 'Your message',
    'feedback.messagePlaceholder': 'Tell us what you think...',
    'feedback.email': 'Email',
    'feedback.emailPlaceholder': 'your@email.com',
    'feedback.optional': 'optional',
    'feedback.send': 'Send feedback',
    'feedback.success.title': 'Thank you!',
    'feedback.success.message': 'Your feedback has been received.',
    'feedback.error': 'Failed to send feedback. Please try again.',
    
    // Supabase auth unavailable
    'supabase.unavailable': 'Authentication service temporarily unavailable. Sign-in may not work. We\'re working on it.',

    // Landing page
    'landing.hero.title': 'Your qualitative research tools, powered by AI',
    'landing.hero.subtitle': 'Transcribe, analyze, and collaborate — with your own API keys. Transparent, private, and free.',
    'landing.hero.cta': 'Get started',
    'landing.modules.transcription.title': 'Transcription',
    'landing.modules.transcription.description': 'Transcribe your interviews with automatic speaker identification. Powered by Voxtral (Mistral AI).',
    'landing.modules.workshop.title': 'Workshop',
    'landing.modules.workshop.description': 'Run collaborative workshops and analyze participant responses with AI clustering.',
    'landing.modules.csv.title': 'CSV Analysis',
    'landing.modules.csv.description': 'Analyze your qualitative Google Forms data — tag extraction, clustering, and synthesis.',
    'landing.modules.cta': 'Discover',
    'landing.modules.persona.title': 'Personas',
    'landing.modules.persona.description': 'Identify user persona groups from quantitative surveys using pairwise correlation clustering.',
    'landing.howItWorks.title': 'How it works',
    'landing.howItWorks.step1.title': 'Sign in',
    'landing.howItWorks.step1.description': 'Create an account with Google in one click.',
    'landing.howItWorks.step2.title': 'Configure your API keys',
    'landing.howItWorks.step2.description': 'Bring your own Mistral and/or Gemini keys. Your keys, your data.',
    'landing.howItWorks.step3.title': 'Use the tools',
    'landing.howItWorks.step3.description': 'Transcribe, analyze, and collaborate — no limits, no hidden costs.',

    // API Keys settings
    'settings.apiKeys.title': 'API Key Configuration',
    'settings.apiKeys.subtitle': 'OpenScribe uses your own API keys. Your keys are encrypted and stored securely.',
    'settings.apiKeys.mistral.title': 'Mistral API Key',
    'settings.apiKeys.mistral.description': 'Required for audio transcription (Voxtral)',
    'settings.apiKeys.gemini.title': 'Google Gemini API Key',
    'settings.apiKeys.gemini.description': 'Required for Workshop and CSV Analysis',
    'settings.apiKeys.getKey': 'Get your key',
    'settings.apiKeys.placeholder': 'Paste your API key here',
    'settings.apiKeys.validate': 'Validate and save',
    'settings.apiKeys.validating': 'Validating...',
    'settings.apiKeys.configured': 'Configured',
    'settings.apiKeys.notConfigured': 'Not configured',
    'settings.apiKeys.modify': 'Modify',
    'settings.apiKeys.remove': 'Remove',
    'settings.apiKeys.invalidKey': 'Invalid API key. Please check and try again.',
    'settings.apiKeys.saved': 'Key saved successfully!',
    'settings.apiKeys.removed': 'Key removed.',
    'settings.apiKeys.required': 'Required to use this module. Configure your key in',
    'settings.apiKeys.settingsLink': 'Settings',
  },
  
  fr: {
    // Header
    'header.signIn': 'Se connecter',
    'header.signOut': 'Se déconnecter',
    
    // Hero
    'hero.title': 'Transcrivez vos audios gratuitement',
    'hero.subtitle': "Transcription professionnelle avec identification des locuteurs. Jusqu'à 1 Go, jusqu'à 2h. Propulsé par Voxtral (Mistral AI)",
    
    // Upload
    'upload.dropzone': 'Déposez votre fichier audio ici',
    'upload.or': 'ou',
    'upload.browse': 'Parcourir les fichiers',
    'upload.formats': 'MP3, WAV, M4A, FLAC, OGG (max 1 Go, 2h)',
    'upload.speakerLanguage': 'Langue des locuteurs',
    'upload.speakerLanguageAuto': 'Détection automatique',
    'upload.speakerLanguageHint':
      'Si vous connaissez la langue, la choisir améliore en général la qualité de la transcription.',
    
    // Progress
    'progress.uploading': 'Téléversement',
    'progress.processing': 'Traitement',
    'progress.transcriptionLanguage': 'Langue de transcription',
    'progress.transcribing': 'Transcription avec Voxtral...',
    
    // Error
    'error.title': 'La transcription a échoué',
    'error.tryAgain': 'Réessayer',
    
    // Transcript viewer
    'transcript.title': 'Transcription',
    'transcript.inputLanguage': 'Votre choix',
    'transcript.detectedLanguage': 'Détectée',
    'transcript.preview': 'Aperçu',
    'transcript.speakers': 'Locuteurs',
    'transcript.plain': 'Texte',
    'transcript.segments': 'Segments',
    'transcript.audio': 'Audio',
    'transcript.transcriptionTime': 'Transcription',
    'transcript.cost': 'Coût',
    'transcript.copy': 'Copier',
    'transcript.copied': 'Copié !',
    'transcript.downloadTxt': 'TXT',
    'transcript.downloadJson': 'JSON',
    'transcript.withSpeakers': 'Avec locuteurs',
    'transcript.noSegments': "Les timestamps par segment ne sont pas disponibles pour cette transcription.",
    
    // Auth CTA
    'auth.cta.title': 'Connectez-vous gratuitement',
    'auth.cta.description': 'Connectez-vous pour voir la transcription complète, copier le texte et télécharger les fichiers.',
    'auth.cta.button': 'Se connecter',
    
    // Auth modal
    'auth.modal.signIn': 'Se connecter',
    'auth.modal.signUp': 'Créer un compte',
    'auth.modal.signInSubtitle': 'Connectez-vous à votre compte',
    'auth.modal.signUpSubtitle': 'Inscrivez-vous pour accéder à vos transcriptions',
    'auth.modal.continueWithGoogle': 'Continuer avec Google',
    'auth.modal.or': 'ou',
    'auth.modal.email': 'Email',
    'auth.modal.password': 'Mot de passe',
    'auth.modal.signInButton': 'Se connecter',
    'auth.modal.signUpButton': "S'inscrire",
    'auth.modal.alreadyAccount': 'Déjà un compte ?',
    'auth.modal.noAccount': 'Pas encore de compte ?',
    'auth.modal.checkEmail': 'Vérifiez votre email pour confirmer votre inscription !',
    'auth.modal.forgotPassword': 'Mot de passe oublié ?',
    
    // Forgot Password page
    'auth.forgotPassword.title': 'Réinitialiser votre mot de passe',
    'auth.forgotPassword.subtitle': 'Entrez votre email et nous vous enverrons un lien de réinitialisation',
    'auth.forgotPassword.sendButton': 'Envoyer le lien',
    'auth.forgotPassword.emailSent': 'Vérifiez votre email ! Nous vous avons envoyé un lien pour réinitialiser votre mot de passe.',
    'auth.forgotPassword.backToSignIn': 'Retour à la connexion',
    'auth.forgotPassword.backToHome': 'Retour à l\'accueil',
    'auth.forgotPassword.expiredLink': 'Ce lien a expiré. Veuillez en demander un nouveau.',
    
    // Reset Password page
    'auth.resetPassword.title': 'Créer un nouveau mot de passe',
    'auth.resetPassword.subtitle': 'Entrez votre nouveau mot de passe ci-dessous',
    'auth.resetPassword.newPassword': 'Nouveau mot de passe',
    'auth.resetPassword.confirmPassword': 'Confirmer le mot de passe',
    'auth.resetPassword.resetButton': 'Réinitialiser le mot de passe',
    'auth.resetPassword.success': 'Votre mot de passe a été réinitialisé avec succès !',
    'auth.resetPassword.redirecting': 'Redirection vers l\'accueil...',
    'auth.resetPassword.passwordMismatch': 'Les mots de passe ne correspondent pas',
    'auth.resetPassword.passwordTooShort': 'Le mot de passe doit contenir au moins 6 caractères',
    'auth.resetPassword.invalidLink': 'Lien invalide ou expiré',
    'auth.resetPassword.invalidLinkDescription': 'Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.',
    'auth.resetPassword.requestNewLink': 'Demander un nouveau lien',
    
    // Features
    'features.speakers.title': 'Détection des locuteurs',
    'features.speakers.description': 'Identification automatique',
    'features.languages.title': '99+ Langues',
    'features.languages.description': 'Détection automatique',
    'features.fast.title': 'Rapide & Précis',
    'features.fast.description': 'Propulsé par Voxtral',
    
    // Footer
    'footer.text': 'OpenScribe - Transcription, Workshop et analyse CSV qualitative pour chercheurs, designers, journalistes et citoyens',
    
    // Privacy notice
    'privacy.notice': 'Les fichiers audio sont envoyés aux serveurs de Mistral AI pour transcription. Ils peuvent utiliser ces données pour améliorer leurs modèles. Aucun fichier n\'est conservé de manière permanente par ce site.',
    
    // Upload errors
    'upload.invalidFormat': 'Format de fichier non supporté. Voxtral accepte uniquement : MP3, WAV, M4A, FLAC, OGG',
    'upload.fileTooLarge': 'Fichier trop volumineux. Taille maximale : {maxSize}',
    'upload.tooLong': 'Audio trop long. Durée maximale : {maxDuration}',
    
    // Actions
    'actions.transcribeAnother': 'Transcrire un autre fichier',
    
    // Feedback
    'feedback.button': 'Avis',
    'feedback.title': 'Envoyez-nous vos retours',
    'feedback.subtitle': '❓ Question, 💡 idée, ⚠️ problème ou 💬 autre — aidez-nous à améliorer !',
    'feedback.message': 'Votre message',
    'feedback.messagePlaceholder': 'Dites-nous ce que vous pensez...',
    'feedback.email': 'Email',
    'feedback.emailPlaceholder': 'votre@email.com',
    'feedback.optional': 'optionnel',
    'feedback.send': 'Envoyer',
    'feedback.success.title': 'Merci !',
    'feedback.success.message': 'Votre retour a bien été reçu.',
    'feedback.error': "Échec de l'envoi. Veuillez réessayer.",
    
    // Supabase auth unavailable
    'supabase.unavailable': "Service d'authentification temporairement indisponible. La connexion peut ne pas fonctionner. Nous y travaillons.",

    // Landing page
    'landing.hero.title': 'Vos outils de recherche qualitative, propulsés par l\'IA',
    'landing.hero.subtitle': 'Transcrivez, analysez et collaborez — avec vos propres clés API. Transparent, privé et gratuit.',
    'landing.hero.cta': 'Commencer',
    'landing.modules.transcription.title': 'Transcription',
    'landing.modules.transcription.description': 'Transcrivez vos entretiens avec identification automatique des locuteurs. Propulsé par Voxtral (Mistral AI).',
    'landing.modules.workshop.title': 'Workshop',
    'landing.modules.workshop.description': 'Animez des ateliers collaboratifs et analysez les réponses des participants avec un clustering IA.',
    'landing.modules.csv.title': 'Analyse CSV',
    'landing.modules.csv.description': 'Analysez vos données qualitatives Google Forms — extraction de tags, clustering et synthèse.',
    'landing.modules.cta': 'Découvrir',
    'landing.modules.persona.title': 'Personas',
    'landing.modules.persona.description': 'Identifiez des groupes de personas a partir de questionnaires quantitatifs grace au clustering par correlation.',
    'landing.howItWorks.title': 'Comment ça marche',
    'landing.howItWorks.step1.title': 'Connectez-vous',
    'landing.howItWorks.step1.description': 'Créez un compte avec Google en un clic.',
    'landing.howItWorks.step2.title': 'Configurez vos clés API',
    'landing.howItWorks.step2.description': 'Apportez vos propres clés Mistral et/ou Gemini. Vos clés, vos données.',
    'landing.howItWorks.step3.title': 'Utilisez les outils',
    'landing.howItWorks.step3.description': 'Transcrivez, analysez et collaborez — sans limites, sans coûts cachés.',

    // API Keys settings
    'settings.apiKeys.title': 'Configuration des clés API',
    'settings.apiKeys.subtitle': 'OpenScribe utilise vos propres clés API. Vos clés sont chiffrées et stockées de manière sécurisée.',
    'settings.apiKeys.mistral.title': 'Clé API Mistral',
    'settings.apiKeys.mistral.description': 'Requise pour la transcription audio (Voxtral)',
    'settings.apiKeys.gemini.title': 'Clé API Google Gemini',
    'settings.apiKeys.gemini.description': 'Requise pour le Workshop et l\'Analyse CSV',
    'settings.apiKeys.getKey': 'Obtenir votre clé',
    'settings.apiKeys.placeholder': 'Collez votre clé API ici',
    'settings.apiKeys.validate': 'Valider et sauvegarder',
    'settings.apiKeys.validating': 'Validation...',
    'settings.apiKeys.configured': 'Configurée',
    'settings.apiKeys.notConfigured': 'Non configurée',
    'settings.apiKeys.modify': 'Modifier',
    'settings.apiKeys.remove': 'Supprimer',
    'settings.apiKeys.invalidKey': 'Clé API invalide. Veuillez vérifier et réessayer.',
    'settings.apiKeys.saved': 'Clé sauvegardée avec succès !',
    'settings.apiKeys.removed': 'Clé supprimée.',
    'settings.apiKeys.required': 'Requise pour utiliser ce module. Configurez votre clé dans les',
    'settings.apiKeys.settingsLink': 'Paramètres',
  },

  es: {
    // Header
    'header.signIn': 'Iniciar sesión',
    'header.signOut': 'Cerrar sesión',
    
    // Hero
    'hero.title': 'Transcribe tu audio gratis',
    'hero.subtitle': 'Transcripción profesional con identificación de hablantes. Hasta 1 GB, hasta 2 horas. Impulsado por Voxtral (Mistral AI)',
    
    // Upload
    'upload.dropzone': 'Suelta tu archivo de audio aquí',
    'upload.or': 'o',
    'upload.browse': 'Explorar archivos',
    'upload.formats': 'MP3, WAV, M4A, FLAC, OGG (max 1 GB, 2h)',
    'upload.speakerLanguage': 'Idioma de los hablantes',
    'upload.speakerLanguageAuto': 'Detección automática',
    'upload.speakerLanguageHint':
      'Si conoces el idioma, elegirlo suele mejorar la calidad de la transcripción.',
    
    // Progress
    'progress.uploading': 'Subiendo',
    'progress.processing': 'Procesando',
    'progress.transcriptionLanguage': 'Idioma de la transcripción',
    'progress.transcribing': 'Transcribiendo con Voxtral...',
    
    // Error
    'error.title': 'La transcripción falló',
    'error.tryAgain': 'Intentar de nuevo',
    
    // Transcript viewer
    'transcript.title': 'Transcripción',
    'transcript.inputLanguage': 'Tu elección',
    'transcript.detectedLanguage': 'Detectado',
    'transcript.preview': 'Vista previa',
    'transcript.speakers': 'Hablantes',
    'transcript.plain': 'Texto',
    'transcript.segments': 'Segmentos',
    'transcript.audio': 'Audio',
    'transcript.transcriptionTime': 'Transcripción',
    'transcript.cost': 'Costo',
    'transcript.copy': 'Copiar',
    'transcript.copied': '¡Copiado!',
    'transcript.downloadTxt': 'TXT',
    'transcript.downloadJson': 'JSON',
    'transcript.withSpeakers': 'Con hablantes',
    'transcript.noSegments': 'Los timestamps por segmento no están disponibles para esta transcripción.',
    
    // Auth CTA
    'auth.cta.title': 'Inicia sesión gratis',
    'auth.cta.description': 'Inicia sesión para ver la transcripción completa, copiar texto y descargar archivos.',
    'auth.cta.button': 'Iniciar sesión',
    
    // Auth modal
    'auth.modal.signIn': 'Iniciar sesión',
    'auth.modal.signUp': 'Crear cuenta',
    'auth.modal.signInSubtitle': 'Inicia sesión en tu cuenta',
    'auth.modal.signUpSubtitle': 'Regístrate para acceder a tus transcripciones',
    'auth.modal.continueWithGoogle': 'Continuar con Google',
    'auth.modal.or': 'o',
    'auth.modal.email': 'Email',
    'auth.modal.password': 'Contraseña',
    'auth.modal.signInButton': 'Iniciar sesión',
    'auth.modal.signUpButton': 'Registrarse',
    'auth.modal.alreadyAccount': '¿Ya tienes cuenta?',
    'auth.modal.noAccount': '¿No tienes cuenta?',
    'auth.modal.checkEmail': '¡Revisa tu email para confirmar tu registro!',
    'auth.modal.forgotPassword': '¿Olvidaste tu contraseña?',
    
    // Forgot Password page
    'auth.forgotPassword.title': 'Restablecer tu contraseña',
    'auth.forgotPassword.subtitle': 'Ingresa tu email y te enviaremos un enlace de restablecimiento',
    'auth.forgotPassword.sendButton': 'Enviar enlace',
    'auth.forgotPassword.emailSent': '¡Revisa tu email! Te hemos enviado un enlace para restablecer tu contraseña.',
    'auth.forgotPassword.backToSignIn': 'Volver a iniciar sesión',
    'auth.forgotPassword.backToHome': 'Volver al inicio',
    'auth.forgotPassword.expiredLink': 'Este enlace ha expirado. Por favor, solicita uno nuevo.',
    
    // Reset Password page
    'auth.resetPassword.title': 'Crear nueva contraseña',
    'auth.resetPassword.subtitle': 'Ingresa tu nueva contraseña a continuación',
    'auth.resetPassword.newPassword': 'Nueva contraseña',
    'auth.resetPassword.confirmPassword': 'Confirmar contraseña',
    'auth.resetPassword.resetButton': 'Restablecer contraseña',
    'auth.resetPassword.success': '¡Tu contraseña ha sido restablecida exitosamente!',
    'auth.resetPassword.redirecting': 'Redirigiendo al inicio...',
    'auth.resetPassword.passwordMismatch': 'Las contraseñas no coinciden',
    'auth.resetPassword.passwordTooShort': 'La contraseña debe tener al menos 6 caracteres',
    'auth.resetPassword.invalidLink': 'Enlace inválido o expirado',
    'auth.resetPassword.invalidLinkDescription': 'Este enlace de restablecimiento es inválido o ha expirado. Por favor, solicita uno nuevo.',
    'auth.resetPassword.requestNewLink': 'Solicitar nuevo enlace',
    
    // Features
    'features.speakers.title': 'Detección de hablantes',
    'features.speakers.description': 'Identificación automática',
    'features.languages.title': '99+ Idiomas',
    'features.languages.description': 'Detección automática',
    'features.fast.title': 'Rápido y Preciso',
    'features.fast.description': 'Impulsado por Voxtral',
    
    // Footer
    'footer.text': 'OpenScribe - Transcripción, talleres colaborativos y análisis cualitativo de CSV para investigadores, diseñadores, periodistas y ciudadanos',
    
    // Privacy notice
    'privacy.notice': 'Los archivos de audio se envían a los servidores de Mistral AI para la transcripción. Pueden usar estos datos para mejorar sus modelos. Este sitio no almacena ningún archivo de forma permanente.',
    
    // Upload errors
    'upload.invalidFormat': 'Formato de archivo no soportado. Voxtral solo acepta: MP3, WAV, M4A, FLAC, OGG',
    'upload.fileTooLarge': 'Archivo demasiado grande. Tamaño máximo: {maxSize}',
    'upload.tooLong': 'Audio demasiado largo. Duración máxima: {maxDuration}',
    
    // Actions
    'actions.transcribeAnother': 'Transcribir otro archivo',
    
    // Feedback
    'feedback.button': 'Opinión',
    'feedback.title': 'Envíanos tu opinión',
    'feedback.subtitle': '❓ Pregunta, 💡 idea, ⚠️ problema o 💬 otro — ¡ayúdanos a mejorar!',
    'feedback.message': 'Tu mensaje',
    'feedback.messagePlaceholder': 'Cuéntanos qué piensas...',
    'feedback.email': 'Email',
    'feedback.emailPlaceholder': 'tu@email.com',
    'feedback.optional': 'opcional',
    'feedback.send': 'Enviar',
    'feedback.success.title': '¡Gracias!',
    'feedback.success.message': 'Tu opinión ha sido recibida.',
    'feedback.error': 'Error al enviar. Por favor, inténtalo de nuevo.',
    
    // Supabase auth unavailable
    'supabase.unavailable': 'Servicio de autenticación temporalmente no disponible. El inicio de sesión puede no funcionar. Estamos trabajando en ello.',

    'landing.hero.title': 'Tus herramientas de investigación cualitativa, impulsadas por IA',
    'landing.hero.subtitle': 'Transcribe, analiza y colabora — con tus propias claves API. Transparente, privado y gratuito.',
    'landing.hero.cta': 'Empezar',
    'landing.modules.transcription.title': 'Transcripción',
    'landing.modules.transcription.description': 'Transcribe tus entrevistas con identificación automática de hablantes. Impulsado por Voxtral (Mistral AI).',
    'landing.modules.workshop.title': 'Workshop',
    'landing.modules.workshop.description': 'Realiza talleres colaborativos y analiza las respuestas de los participantes con clustering IA.',
    'landing.modules.csv.title': 'Análisis CSV',
    'landing.modules.csv.description': 'Analiza tus datos cualitativos de Google Forms — extracción de etiquetas, clustering y síntesis.',
    'landing.modules.cta': 'Descubrir',
    'landing.modules.persona.title': 'Personas',
    'landing.modules.persona.description': 'Identifica grupos de personas a partir de encuestas cuantitativas usando clustering por correlacion.',
    'landing.howItWorks.title': 'Cómo funciona',
    'landing.howItWorks.step1.title': 'Inicia sesión',
    'landing.howItWorks.step1.description': 'Crea una cuenta con Google en un clic.',
    'landing.howItWorks.step2.title': 'Configura tus claves API',
    'landing.howItWorks.step2.description': 'Trae tus propias claves Mistral y/o Gemini. Tus claves, tus datos.',
    'landing.howItWorks.step3.title': 'Usa las herramientas',
    'landing.howItWorks.step3.description': 'Transcribe, analiza y colabora — sin límites, sin costos ocultos.',

    'settings.apiKeys.title': 'Configuración de claves API',
    'settings.apiKeys.subtitle': 'OpenScribe utiliza tus propias claves API. Tus claves se cifran y almacenan de forma segura.',
    'settings.apiKeys.mistral.title': 'Clave API Mistral',
    'settings.apiKeys.mistral.description': 'Requerida para la transcripción de audio (Voxtral)',
    'settings.apiKeys.gemini.title': 'Clave API Google Gemini',
    'settings.apiKeys.gemini.description': 'Requerida para Workshop y Análisis CSV',
    'settings.apiKeys.getKey': 'Obtener tu clave',
    'settings.apiKeys.placeholder': 'Pega tu clave API aquí',
    'settings.apiKeys.validate': 'Validar y guardar',
    'settings.apiKeys.validating': 'Validando...',
    'settings.apiKeys.configured': 'Configurada',
    'settings.apiKeys.notConfigured': 'No configurada',
    'settings.apiKeys.modify': 'Modificar',
    'settings.apiKeys.remove': 'Eliminar',
    'settings.apiKeys.invalidKey': 'Clave API inválida. Verifica e intenta de nuevo.',
    'settings.apiKeys.saved': '¡Clave guardada exitosamente!',
    'settings.apiKeys.removed': 'Clave eliminada.',
    'settings.apiKeys.required': 'Requerida para usar este módulo. Configura tu clave en',
    'settings.apiKeys.settingsLink': 'Configuración',
  },

  pt: {
    // Header
    'header.signIn': 'Entrar',
    'header.signOut': 'Sair',
    
    // Hero
    'hero.title': 'Transcreva seu áudio gratuitamente',
    'hero.subtitle': 'Transcrição profissional com identificação de falantes. Até 1 GB, até 2 horas. Powered by Voxtral (Mistral AI)',
    
    // Upload
    'upload.dropzone': 'Solte seu arquivo de áudio aqui',
    'upload.or': 'ou',
    'upload.browse': 'Procurar arquivos',
    'upload.formats': 'MP3, WAV, M4A, FLAC, OGG (max 1 GB, 2h)',
    'upload.speakerLanguage': 'Idioma dos falantes',
    'upload.speakerLanguageAuto': 'Deteção automática',
    'upload.speakerLanguageHint':
      'Se você souber o idioma, escolhê-lo em geral melhora a qualidade da transcrição.',
    
    // Progress
    'progress.uploading': 'Enviando',
    'progress.processing': 'Processando',
    'progress.transcriptionLanguage': 'Idioma da transcrição',
    'progress.transcribing': 'Transcrevendo com Voxtral...',
    
    // Error
    'error.title': 'A transcrição falhou',
    'error.tryAgain': 'Tentar novamente',
    
    // Transcript viewer
    'transcript.title': 'Transcrição',
    'transcript.inputLanguage': 'Sua escolha',
    'transcript.detectedLanguage': 'Detectado',
    'transcript.preview': 'Prévia',
    'transcript.speakers': 'Falantes',
    'transcript.plain': 'Texto',
    'transcript.segments': 'Segmentos',
    'transcript.audio': 'Áudio',
    'transcript.transcriptionTime': 'Transcrição',
    'transcript.cost': 'Custo',
    'transcript.copy': 'Copiar',
    'transcript.copied': 'Copiado!',
    'transcript.downloadTxt': 'TXT',
    'transcript.downloadJson': 'JSON',
    'transcript.withSpeakers': 'Com falantes',
    'transcript.noSegments': 'Os timestamps por segmento não estão disponíveis para esta transcrição.',
    
    // Auth CTA
    'auth.cta.title': 'Entre gratuitamente',
    'auth.cta.description': 'Entre para ver a transcrição completa, copiar texto e baixar arquivos.',
    'auth.cta.button': 'Entrar',
    
    // Auth modal
    'auth.modal.signIn': 'Entrar',
    'auth.modal.signUp': 'Criar conta',
    'auth.modal.signInSubtitle': 'Entre na sua conta',
    'auth.modal.signUpSubtitle': 'Cadastre-se para acessar suas transcrições',
    'auth.modal.continueWithGoogle': 'Continuar com Google',
    'auth.modal.or': 'ou',
    'auth.modal.email': 'Email',
    'auth.modal.password': 'Senha',
    'auth.modal.signInButton': 'Entrar',
    'auth.modal.signUpButton': 'Cadastrar',
    'auth.modal.alreadyAccount': 'Já tem uma conta?',
    'auth.modal.noAccount': 'Não tem conta?',
    'auth.modal.checkEmail': 'Verifique seu email para confirmar seu cadastro!',
    'auth.modal.forgotPassword': 'Esqueceu a senha?',
    
    // Forgot Password page
    'auth.forgotPassword.title': 'Redefinir sua senha',
    'auth.forgotPassword.subtitle': 'Insira seu email e enviaremos um link de redefinição',
    'auth.forgotPassword.sendButton': 'Enviar link',
    'auth.forgotPassword.emailSent': 'Verifique seu email! Enviamos um link para redefinir sua senha.',
    'auth.forgotPassword.backToSignIn': 'Voltar para entrar',
    'auth.forgotPassword.backToHome': 'Voltar ao início',
    'auth.forgotPassword.expiredLink': 'Este link expirou. Por favor, solicite um novo.',
    
    // Reset Password page
    'auth.resetPassword.title': 'Criar nova senha',
    'auth.resetPassword.subtitle': 'Insira sua nova senha abaixo',
    'auth.resetPassword.newPassword': 'Nova senha',
    'auth.resetPassword.confirmPassword': 'Confirmar senha',
    'auth.resetPassword.resetButton': 'Redefinir senha',
    'auth.resetPassword.success': 'Sua senha foi redefinida com sucesso!',
    'auth.resetPassword.redirecting': 'Redirecionando para o início...',
    'auth.resetPassword.passwordMismatch': 'As senhas não coincidem',
    'auth.resetPassword.passwordTooShort': 'A senha deve ter pelo menos 6 caracteres',
    'auth.resetPassword.invalidLink': 'Link inválido ou expirado',
    'auth.resetPassword.invalidLinkDescription': 'Este link de redefinição é inválido ou expirou. Por favor, solicite um novo.',
    'auth.resetPassword.requestNewLink': 'Solicitar novo link',
    
    // Features
    'features.speakers.title': 'Detecção de falantes',
    'features.speakers.description': 'Identificação automática',
    'features.languages.title': '99+ Idiomas',
    'features.languages.description': 'Detecção automática',
    'features.fast.title': 'Rápido e Preciso',
    'features.fast.description': 'Powered by Voxtral',
    
    // Footer
    'footer.text': 'OpenScribe - Transcrição, workshops colaborativos e análise qualitativa de CSV para pesquisadores, designers, jornalistas e cidadãos',
    
    // Privacy notice
    'privacy.notice': 'Os arquivos de áudio são enviados para os servidores da Mistral AI para transcrição. Eles podem usar esses dados para melhorar seus modelos. Nenhum arquivo é armazenado permanentemente por este site.',
    
    // Upload errors
    'upload.invalidFormat': 'Formato de arquivo não suportado. Voxtral aceita apenas: MP3, WAV, M4A, FLAC, OGG',
    'upload.fileTooLarge': 'Arquivo muito grande. Tamanho máximo: {maxSize}',
    'upload.tooLong': 'Áudio muito longo. Duração máxima: {maxDuration}',
    
    // Actions
    'actions.transcribeAnother': 'Transcrever outro arquivo',
    
    // Feedback
    'feedback.button': 'Opinião',
    'feedback.title': 'Envie sua opinião',
    'feedback.subtitle': '❓ Pergunta, 💡 ideia, ⚠️ problema ou 💬 outro — ajude-nos a melhorar!',
    'feedback.message': 'Sua mensagem',
    'feedback.messagePlaceholder': 'Conte-nos o que você pensa...',
    'feedback.email': 'Email',
    'feedback.emailPlaceholder': 'seu@email.com',
    'feedback.optional': 'opcional',
    'feedback.send': 'Enviar',
    'feedback.success.title': 'Obrigado!',
    'feedback.success.message': 'Seu feedback foi recebido.',
    'feedback.error': 'Falha ao enviar. Por favor, tente novamente.',
    
    // Supabase auth unavailable
    'supabase.unavailable': 'Serviço de autenticação temporariamente indisponível. O login pode não funcionar. Estamos trabalhando nisso.',

    'landing.hero.title': 'Suas ferramentas de pesquisa qualitativa, impulsionadas por IA',
    'landing.hero.subtitle': 'Transcreva, analise e colabore — com suas próprias chaves API. Transparente, privado e gratuito.',
    'landing.hero.cta': 'Começar',
    'landing.modules.transcription.title': 'Transcrição',
    'landing.modules.transcription.description': 'Transcreva suas entrevistas com identificação automática de falantes. Powered by Voxtral (Mistral AI).',
    'landing.modules.workshop.title': 'Workshop',
    'landing.modules.workshop.description': 'Realize workshops colaborativos e analise as respostas dos participantes com clustering IA.',
    'landing.modules.csv.title': 'Análise CSV',
    'landing.modules.csv.description': 'Analise seus dados qualitativos do Google Forms — extração de tags, clustering e síntese.',
    'landing.modules.cta': 'Descobrir',
    'landing.modules.persona.title': 'Personas',
    'landing.modules.persona.description': 'Identifique grupos de personas a partir de pesquisas quantitativas usando clustering por correlacao.',
    'landing.howItWorks.title': 'Como funciona',
    'landing.howItWorks.step1.title': 'Entre',
    'landing.howItWorks.step1.description': 'Crie uma conta com Google em um clique.',
    'landing.howItWorks.step2.title': 'Configure suas chaves API',
    'landing.howItWorks.step2.description': 'Traga suas próprias chaves Mistral e/ou Gemini. Suas chaves, seus dados.',
    'landing.howItWorks.step3.title': 'Use as ferramentas',
    'landing.howItWorks.step3.description': 'Transcreva, analise e colabore — sem limites, sem custos ocultos.',

    'settings.apiKeys.title': 'Configuração de chaves API',
    'settings.apiKeys.subtitle': 'OpenScribe utiliza suas próprias chaves API. Suas chaves são criptografadas e armazenadas com segurança.',
    'settings.apiKeys.mistral.title': 'Chave API Mistral',
    'settings.apiKeys.mistral.description': 'Necessária para transcrição de áudio (Voxtral)',
    'settings.apiKeys.gemini.title': 'Chave API Google Gemini',
    'settings.apiKeys.gemini.description': 'Necessária para Workshop e Análise CSV',
    'settings.apiKeys.getKey': 'Obter sua chave',
    'settings.apiKeys.placeholder': 'Cole sua chave API aqui',
    'settings.apiKeys.validate': 'Validar e salvar',
    'settings.apiKeys.validating': 'Validando...',
    'settings.apiKeys.configured': 'Configurada',
    'settings.apiKeys.notConfigured': 'Não configurada',
    'settings.apiKeys.modify': 'Modificar',
    'settings.apiKeys.remove': 'Remover',
    'settings.apiKeys.invalidKey': 'Chave API inválida. Verifique e tente novamente.',
    'settings.apiKeys.saved': 'Chave salva com sucesso!',
    'settings.apiKeys.removed': 'Chave removida.',
    'settings.apiKeys.required': 'Necessária para usar este módulo. Configure sua chave em',
    'settings.apiKeys.settingsLink': 'Configurações',
  },

  de: {
    // Header
    'header.signIn': 'Anmelden',
    'header.signOut': 'Abmelden',
    
    // Hero
    'hero.title': 'Transkribiere dein Audio kostenlos',
    'hero.subtitle': 'Professionelle Transkription mit Sprechererkennung. Bis zu 1 GB, bis zu 2 Stunden. Powered by Voxtral (Mistral AI)',
    
    // Upload
    'upload.dropzone': 'Audiodatei hier ablegen',
    'upload.or': 'oder',
    'upload.browse': 'Dateien durchsuchen',
    'upload.formats': 'MP3, WAV, M4A, FLAC, OGG (max 1 GB, 2h)',
    'upload.speakerLanguage': 'Sprache der Sprecher',
    'upload.speakerLanguageAuto': 'Automatische Erkennung',
    'upload.speakerLanguageHint':
      'Wenn Sie die Sprache kennen, verbessert deren Auswahl meist die Transkriptionsqualität.',
    
    // Progress
    'progress.uploading': 'Hochladen',
    'progress.processing': 'Verarbeitung',
    'progress.transcriptionLanguage': 'Transkriptionssprache',
    'progress.transcribing': 'Transkription mit Voxtral...',
    
    // Error
    'error.title': 'Transkription fehlgeschlagen',
    'error.tryAgain': 'Erneut versuchen',
    
    // Transcript viewer
    'transcript.title': 'Transkription',
    'transcript.inputLanguage': 'Ihre Auswahl',
    'transcript.detectedLanguage': 'Erkannt',
    'transcript.preview': 'Vorschau',
    'transcript.speakers': 'Sprecher',
    'transcript.plain': 'Text',
    'transcript.segments': 'Segmente',
    'transcript.audio': 'Audio',
    'transcript.transcriptionTime': 'Transkription',
    'transcript.cost': 'Kosten',
    'transcript.copy': 'Kopieren',
    'transcript.copied': 'Kopiert!',
    'transcript.downloadTxt': 'TXT',
    'transcript.downloadJson': 'JSON',
    'transcript.withSpeakers': 'Mit Sprechern',
    'transcript.noSegments': 'Segment-Timestamps sind für diese Transkription nicht verfügbar.',
    
    // Auth CTA
    'auth.cta.title': 'Kostenlos anmelden',
    'auth.cta.description': 'Melde dich an, um die vollständige Transkription zu sehen, Text zu kopieren und Dateien herunterzuladen.',
    'auth.cta.button': 'Anmelden',
    
    // Auth modal
    'auth.modal.signIn': 'Anmelden',
    'auth.modal.signUp': 'Konto erstellen',
    'auth.modal.signInSubtitle': 'Bei deinem Konto anmelden',
    'auth.modal.signUpSubtitle': 'Registriere dich für Zugang zu deinen Transkriptionen',
    'auth.modal.continueWithGoogle': 'Mit Google fortfahren',
    'auth.modal.or': 'oder',
    'auth.modal.email': 'E-Mail',
    'auth.modal.password': 'Passwort',
    'auth.modal.signInButton': 'Anmelden',
    'auth.modal.signUpButton': 'Registrieren',
    'auth.modal.alreadyAccount': 'Bereits ein Konto?',
    'auth.modal.noAccount': 'Noch kein Konto?',
    'auth.modal.checkEmail': 'Überprüfe deine E-Mail, um deine Registrierung zu bestätigen!',
    'auth.modal.forgotPassword': 'Passwort vergessen?',
    
    // Forgot Password page
    'auth.forgotPassword.title': 'Passwort zurücksetzen',
    'auth.forgotPassword.subtitle': 'Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen',
    'auth.forgotPassword.sendButton': 'Link senden',
    'auth.forgotPassword.emailSent': 'Überprüfe deine E-Mail! Wir haben dir einen Link zum Zurücksetzen deines Passworts gesendet.',
    'auth.forgotPassword.backToSignIn': 'Zurück zur Anmeldung',
    'auth.forgotPassword.backToHome': 'Zurück zur Startseite',
    'auth.forgotPassword.expiredLink': 'Dieser Link ist abgelaufen. Bitte fordere einen neuen an.',
    
    // Reset Password page
    'auth.resetPassword.title': 'Neues Passwort erstellen',
    'auth.resetPassword.subtitle': 'Gib unten dein neues Passwort ein',
    'auth.resetPassword.newPassword': 'Neues Passwort',
    'auth.resetPassword.confirmPassword': 'Passwort bestätigen',
    'auth.resetPassword.resetButton': 'Passwort zurücksetzen',
    'auth.resetPassword.success': 'Dein Passwort wurde erfolgreich zurückgesetzt!',
    'auth.resetPassword.redirecting': 'Weiterleitung zur Startseite...',
    'auth.resetPassword.passwordMismatch': 'Passwörter stimmen nicht überein',
    'auth.resetPassword.passwordTooShort': 'Passwort muss mindestens 6 Zeichen lang sein',
    'auth.resetPassword.invalidLink': 'Ungültiger oder abgelaufener Link',
    'auth.resetPassword.invalidLinkDescription': 'Dieser Link zum Zurücksetzen ist ungültig oder abgelaufen. Bitte fordere einen neuen an.',
    'auth.resetPassword.requestNewLink': 'Neuen Link anfordern',
    
    // Features
    'features.speakers.title': 'Sprechererkennung',
    'features.speakers.description': 'Automatische Identifikation',
    'features.languages.title': '99+ Sprachen',
    'features.languages.description': 'Automatische Erkennung',
    'features.fast.title': 'Schnell & Präzise',
    'features.fast.description': 'Powered by Voxtral',
    
    // Footer
    'footer.text': 'OpenScribe - Transkription, kollaborative Workshops und qualitative CSV-Analyse für Forscher, Designer, Journalisten und Bürger',
    
    // Privacy notice
    'privacy.notice': 'Audiodateien werden zur Transkription an die Server von Mistral AI gesendet. Sie können diese Daten zur Verbesserung ihrer Modelle verwenden. Keine Dateien werden dauerhaft von dieser Seite gespeichert.',
    
    // Upload errors
    'upload.invalidFormat': 'Nicht unterstütztes Dateiformat. Voxtral akzeptiert nur: MP3, WAV, M4A, FLAC, OGG',
    'upload.fileTooLarge': 'Datei zu groß. Maximale Größe: {maxSize}',
    'upload.tooLong': 'Audio zu lang. Maximale Dauer: {maxDuration}',
    
    // Actions
    'actions.transcribeAnother': 'Weitere Datei transkribieren',
    
    // Feedback
    'feedback.button': 'Meinung',
    'feedback.title': 'Senden Sie uns Ihre Meinung',
    'feedback.subtitle': '❓ Frage, 💡 Idee, ⚠️ Problem oder 💬 Anderes — helfen Sie uns zu verbessern!',
    'feedback.message': 'Ihre Nachricht',
    'feedback.messagePlaceholder': 'Sagen Sie uns, was Sie denken...',
    'feedback.email': 'E-Mail',
    'feedback.emailPlaceholder': 'ihre@email.com',
    'feedback.optional': 'optional',
    'feedback.send': 'Senden',
    'feedback.success.title': 'Danke!',
    'feedback.success.message': 'Ihr Feedback wurde empfangen.',
    'feedback.error': 'Fehler beim Senden. Bitte versuchen Sie es erneut.',
    
    // Supabase auth unavailable
    'supabase.unavailable': 'Authentifizierungsdienst vorübergehend nicht verfügbar. Die Anmeldung funktioniert möglicherweise nicht. Wir arbeiten daran.',

    'landing.hero.title': 'Ihre qualitativen Forschungstools, angetrieben von KI',
    'landing.hero.subtitle': 'Transkribieren, analysieren und zusammenarbeiten — mit Ihren eigenen API-Schlüsseln. Transparent, privat und kostenlos.',
    'landing.hero.cta': 'Loslegen',
    'landing.modules.transcription.title': 'Transkription',
    'landing.modules.transcription.description': 'Transkribieren Sie Ihre Interviews mit automatischer Sprechererkennung. Powered by Voxtral (Mistral AI).',
    'landing.modules.workshop.title': 'Workshop',
    'landing.modules.workshop.description': 'Führen Sie kollaborative Workshops durch und analysieren Sie Teilnehmerantworten mit KI-Clustering.',
    'landing.modules.csv.title': 'CSV-Analyse',
    'landing.modules.csv.description': 'Analysieren Sie Ihre qualitativen Google Forms-Daten — Tag-Extraktion, Clustering und Synthese.',
    'landing.modules.cta': 'Entdecken',
    'landing.modules.persona.title': 'Personas',
    'landing.modules.persona.description': 'Identifizieren Sie Persona-Gruppen aus quantitativen Umfragen durch paarweise Korrelations-Clustering.',
    'landing.howItWorks.title': 'So funktioniert es',
    'landing.howItWorks.step1.title': 'Anmelden',
    'landing.howItWorks.step1.description': 'Erstellen Sie ein Konto mit Google in einem Klick.',
    'landing.howItWorks.step2.title': 'API-Schlüssel konfigurieren',
    'landing.howItWorks.step2.description': 'Bringen Sie Ihre eigenen Mistral und/oder Gemini Schlüssel mit. Ihre Schlüssel, Ihre Daten.',
    'landing.howItWorks.step3.title': 'Tools verwenden',
    'landing.howItWorks.step3.description': 'Transkribieren, analysieren und zusammenarbeiten — ohne Grenzen, ohne versteckte Kosten.',

    'settings.apiKeys.title': 'API-Schlüssel Konfiguration',
    'settings.apiKeys.subtitle': 'OpenScribe verwendet Ihre eigenen API-Schlüssel. Ihre Schlüssel werden verschlüsselt und sicher gespeichert.',
    'settings.apiKeys.mistral.title': 'Mistral API-Schlüssel',
    'settings.apiKeys.mistral.description': 'Erforderlich für Audio-Transkription (Voxtral)',
    'settings.apiKeys.gemini.title': 'Google Gemini API-Schlüssel',
    'settings.apiKeys.gemini.description': 'Erforderlich für Workshop und CSV-Analyse',
    'settings.apiKeys.getKey': 'Schlüssel erhalten',
    'settings.apiKeys.placeholder': 'API-Schlüssel hier einfügen',
    'settings.apiKeys.validate': 'Validieren und speichern',
    'settings.apiKeys.validating': 'Validierung...',
    'settings.apiKeys.configured': 'Konfiguriert',
    'settings.apiKeys.notConfigured': 'Nicht konfiguriert',
    'settings.apiKeys.modify': 'Ändern',
    'settings.apiKeys.remove': 'Entfernen',
    'settings.apiKeys.invalidKey': 'Ungültiger API-Schlüssel. Bitte überprüfen und erneut versuchen.',
    'settings.apiKeys.saved': 'Schlüssel erfolgreich gespeichert!',
    'settings.apiKeys.removed': 'Schlüssel entfernt.',
    'settings.apiKeys.required': 'Erforderlich um dieses Modul zu nutzen. Konfigurieren Sie Ihren Schlüssel in den',
    'settings.apiKeys.settingsLink': 'Einstellungen',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];
