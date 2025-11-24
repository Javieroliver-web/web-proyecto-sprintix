package com.sprintix.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class ConfigController {

    @Value("${api.public.url}")
    private String apiUrl;

    /**
     * Endpoint para que el JavaScript del navegador obtenga la URL de la API
     * Llamar desde JS: fetch('/config').then(r => r.json())
     */
    @GetMapping("/config")
    public Map<String, String> getConfig() {
        return Map.of("apiUrl", apiUrl);
    }
}