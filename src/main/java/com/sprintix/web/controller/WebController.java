// ... métodos anteriores ...

    // --- LISTA DE PROYECTOS ---
    @GetMapping("/proyectos")
    public String proyectos(HttpSession session, Model model) {
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");

        if (token == null) return "redirect:/";

        // Pedir proyectos al backend
        var proyectos = apiService.getProyectos(token);

        model.addAttribute("usuario", usuario);
        model.addAttribute("proyectos", proyectos);
        
        return "proyectos"; // Busca templates/proyectos.html
    }

    // --- TABLERO KANBAN ---
    @GetMapping("/board")
    public String board(@RequestParam int id, HttpSession session, Model model) {
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");

        if (token == null) return "redirect:/";

        // Pedir datos del tablero
        Map<String, Object> data = apiService.getTableroData(id, token);
        
        if (data == null) return "redirect:/proyectos";

        model.addAttribute("usuario", usuario);
        model.addAttribute("proyecto", data.get("proyecto"));
        model.addAttribute("tareas", data.get("tareas"));
        
        // IMPORTANTE: Pasamos el token a la vista para que el JS pueda hacer Drag & Drop
        // Esto es un "puente" necesario para la interactividad
        model.addAttribute("token", token); 

        return "board"; // Busca templates/board.html
    }