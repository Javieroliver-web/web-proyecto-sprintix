package com.sprintix.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Controlador de prueba para verificar el manejo de errores
 * IMPORTANTE: Este controlador es solo para desarrollo/testing
 * Elimínalo o coméntalo antes de subir a producción
 */
@Controller
@RequestMapping("/test")
public class TestErrorController {

    /**
     * Prueba un error genérico (RuntimeException)
     * URL: http://localhost:4000/test/error
     */
    @GetMapping("/error")
    public String testGenericError() {
        throw new RuntimeException("Este es un error de prueba genérico");
    }

    /**
     * Prueba un error de validación (IllegalArgumentException)
     * URL: http://localhost:4000/test/validation
     */
    @GetMapping("/validation")
    public String testValidationError() {
        throw new IllegalArgumentException("Datos de prueba inválidos: el campo 'nombre' no puede estar vacío");
    }

    /**
     * Prueba un error de sesión (IllegalStateException)
     * URL: http://localhost:4000/test/session
     */
    @GetMapping("/session")
    public String testSessionError() {
        throw new IllegalStateException("Sesión de prueba expirada");
    }

    /**
     * Prueba un error de null pointer
     * URL: http://localhost:4000/test/nullpointer
     */
    @GetMapping("/nullpointer")
    public String testNullPointerError() {
        String texto = null;
        return texto.toUpperCase(); // Esto lanzará NullPointerException
    }

    /**
     * Prueba un error con parámetro personalizado
     * URL: http://localhost:4000/test/custom?message=Tu mensaje aquí
     */
    @GetMapping("/custom")
    public String testCustomError(@RequestParam(required = false) String message) {
        if (message == null || message.isEmpty()) {
            throw new IllegalArgumentException("El parámetro 'message' es requerido");
        }
        throw new RuntimeException("Error personalizado: " + message);
    }

    /**
     * Prueba un error de división por cero
     * URL: http://localhost:4000/test/arithmetic
     */
    @GetMapping("/arithmetic")
    public String testArithmeticError() {
        int resultado = 10 / 0; // Esto lanzará ArithmeticException
        return "dashboard";
    }

    /**
     * Prueba un error de acceso a array fuera de rango
     * URL: http://localhost:4000/test/arrayindex
     */
    @GetMapping("/arrayindex")
    public String testArrayIndexError() {
        int[] numeros = {1, 2, 3};
        int valor = numeros[10]; // Esto lanzará ArrayIndexOutOfBoundsException
        return "dashboard";
    }

    /**
     * Simula un error de base de datos
     * URL: http://localhost:4000/test/database
     */
    @GetMapping("/database")
    public String testDatabaseError() {
        throw new RuntimeException("Error de conexión a la base de datos: Timeout after 30 seconds");
    }

    /**
     * Simula un error de API externa
     * URL: http://localhost:4000/test/api
     */
    @GetMapping("/api")
    public String testApiError() {
        throw new RuntimeException("Error al conectar con la API externa: HTTP 503 Service Unavailable");
    }

    /**
     * Prueba exitosa (no lanza error)
     * URL: http://localhost:4000/test/success
     */
    @GetMapping("/success")
    public String testSuccess() {
        return "dashboard"; // Esto debería funcionar normalmente
    }

    /**
     * Endpoint de información sobre las pruebas disponibles
     * URL: http://localhost:4000/test/info
     */
    @GetMapping("/info")
    public String testInfo() {
        System.out.println("=== ENDPOINTS DE PRUEBA DISPONIBLES ===");
        System.out.println("1. /test/error          - Error genérico");
        System.out.println("2. /test/validation     - Error de validación");
        System.out.println("3. /test/session        - Error de sesión");
        System.out.println("4. /test/nullpointer    - NullPointerException");
        System.out.println("5. /test/custom?message - Error personalizado");
        System.out.println("6. /test/arithmetic     - Error aritmético");
        System.out.println("7. /test/arrayindex     - Error de índice");
        System.out.println("8. /test/database       - Error de BD simulado");
        System.out.println("9. /test/api            - Error de API simulado");
        System.out.println("10. /test/success       - Sin error (éxito)");
        System.out.println("=====================================");
        
        return "dashboard";
    }
}