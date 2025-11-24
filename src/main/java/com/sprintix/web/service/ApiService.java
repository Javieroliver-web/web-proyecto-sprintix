// ... métodos anteriores (login, getMe, getDashboard) ...

    // Obtener lista de proyectos
    public List<Map<String, Object>> getProyectos(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                apiUrl + "/proyectos",
                HttpMethod.GET,
                entity,
                List.class
            );
            return response.getBody();
        } catch (Exception e) {
            return List.of(); // Retornar lista vacía si falla
        }
    }

    // Obtener datos para el Tablero (Proyecto + Tareas)
    public Map<String, Object> getTableroData(int proyectoId, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            // 1. Pedir Proyecto
            ResponseEntity<Map> resProyecto = restTemplate.exchange(
                apiUrl + "/proyectos/" + proyectoId, HttpMethod.GET, entity, Map.class
            );
            
            // 2. Pedir Tareas
            ResponseEntity<List> resTareas = restTemplate.exchange(
                apiUrl + "/tareas/proyecto/" + proyectoId, HttpMethod.GET, entity, List.class
            );

            return Map.of(
                "proyecto", resProyecto.getBody(),
                "tareas", resTareas.getBody()
            );
        } catch (Exception e) {
            return null;
        }
    }