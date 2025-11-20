package com.sprintix.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class ConfigController {

    // Inyecta la URL desde Docker o usa localhost por defecto
    @Value("${API_URL_PUBLIC:http://localhost:8080/api}")
    private String apiUrl;

    @GetMapping("/config")
    public Map<String, String> getConfig() {
        return Map.of("apiUrl", apiUrl);
    }
}