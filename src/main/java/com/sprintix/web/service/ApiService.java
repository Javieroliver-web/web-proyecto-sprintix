package com.sprintix.web.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;
import java.util.Collections;

@Service
public class ApiService {

    @Value("${api.base.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Login
    public String login(String email, String password) {
        try {
            Map<String, String> body = Map.of("email", email, "password", password);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                apiUrl + "/auth/login", body, Map.class
            );
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("token");
            }
        } catch (HttpClientErrorException e) {
            System.err.println("Error en login: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error inesperado: " + e.getMessage());
        }
        return null;
    }

    // Get Me
    public Map getMe(String token) {
        return makeGetRequest("/auth/me", token, Map.class);
    }

    // Get Dashboard
    public Map getDashboard(int usuarioId, String token) {
        return makeGetRequest("/usuarios/" + usuarioId + "/dashboard", token, Map.class);
    }

    // Get Proyectos
    public List<Map<String, Object>> getProyectos(String token) {
        List result = makeGetRequest("/proyectos", token, List.class);
        return result != null ? result : Collections.emptyList();
    }

    // Get Tablero (Proyecto + Tareas)
    public Map<String, Object> getTableroData(int proyectoId, String token) {
        Map proyecto = makeGetRequest("/proyectos/" + proyectoId, token, Map.class);
        List tareas = makeGetRequest("/tareas/proyecto/" + proyectoId, token, List.class);
        
        if (proyecto != null) {
            return Map.of(
                "proyecto", proyecto, 
                "tareas", tareas != null ? tareas : Collections.emptyList()
            );
        }
        return null;
    }

    // Helper genérico con manejo de errores mejorado
    private <T> T makeGetRequest(String endpoint, String token, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<T> response = restTemplate.exchange(
                apiUrl + endpoint, 
                HttpMethod.GET, 
                entity, 
                responseType
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            System.err.println("Error HTTP " + e.getStatusCode() + " en " + endpoint);
            return null;
        } catch (Exception e) {
            System.err.println("Error en petición a " + endpoint + ": " + e.getMessage());
            return null;
        }
    }
}