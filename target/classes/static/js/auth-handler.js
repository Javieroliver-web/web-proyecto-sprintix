// src/main/resources/static/js/auth-handler.js

/**
 * Manejo seguro de autenticación y tokens
 */

class AuthHandler {
    constructor() {
        this.token = window.JWT_TOKEN || null;
        this.tokenExpiry = null;
        this.checkTokenValidity();
    }

    /**
     * Verificar si el token sigue siendo válido
     */
    checkTokenValidity() {
        if (!this.token) return false;

        try {
            // Decodificar el payload del JWT (sin validar firma, solo lectura)
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const expiry = payload.exp * 1000; // Convertir a milisegundos
            
            if (Date.now() >= expiry) {
                this.handleExpiredToken();
                return false;
            }
            
            this.tokenExpiry = expiry;
            this.scheduleTokenRefresh();
            return true;
        } catch (error) {
            console.error('Error verificando token:', error);
            return false;
        }
    }

    /**
     * Programar renovación del token antes de que expire
     */
    scheduleTokenRefresh() {
        const timeUntilExpiry = this.tokenExpiry - Date.now();
        const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // 5 minutos antes

        if (refreshTime > 0) {
            setTimeout(() => {
                this.showRefreshWarning();
            }, refreshTime);
        }
    }

    /**
     * Mostrar advertencia de expiración próxima
     */
    showRefreshWarning() {
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff9800;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
        `;
        banner.innerHTML = `
            Tu sesión expirará pronto. 
            <a href="#" onclick="location.reload()" style="color: white; font-weight: bold;">
                Renovar ahora
            </a>
        `;
        document.body.prepend(banner);
    }

    /**
     * Manejar token expirado
     */
    handleExpiredToken() {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        window.location.href = '/logout';
    }

    /**
     * Obtener token para peticiones
     */
    getToken() {
        return this.token;
    }
}

// Instancia global
const authHandler = new AuthHandler();