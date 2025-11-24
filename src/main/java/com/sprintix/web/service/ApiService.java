package com.sprintix.web.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;
import java.util.Collections;

@Service
public class ApiService {

    @Value("${API_URL_PUBLIC:http://localhost:8080/api}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Login
    public String login(String email, String password) {
        try {
            Map<String, String> body = Map.of("email", email, "password", password);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl + "/auth/login", body, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("token");
            }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    // Get Me
    public Map getMe(String token) {
        return makeGetRequest(apiUrl + "/auth/me", token, Map.class);
    }

    // Get Dashboard
    public Map getDashboard(int usuarioId, String token) {
        return makeGetRequest(apiUrl + "/usuarios/" + usuarioId + "/dashboard", token, Map.class);
    }

    // --- NUEVOS MÉTODOS ---

    // Get Proyectos
    public List<Map<String, Object>> getProyectos(String token) {
        List result = makeGetRequest(apiUrl + "/proyectos", token, List.class);
        return result != null ? result : Collections.emptyList();
    }

    // Get Tablero (Proyecto + Tareas)
    public Map<String, Object> getTableroData(int proyectoId, String token) {
        Map proyecto = makeGetRequest(apiUrl + "/proyectos/" + proyectoId, token, Map.class);
        List tareas = makeGetRequest(apiUrl + "/tareas/proyecto/" + proyectoId, token, List.class);
        
        if (proyecto != null) {
            return Map.of("proyecto", proyecto, "tareas", tareas != null ? tareas : Collections.emptyList());
        }
        return null;
    }

    // Helper genérico para no repetir código
    private <T> T makeGetRequest(String url, String token, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.GET, entity, responseType);
            return response.getBody();
        } catch (Exception e) { return null; }
    }
}