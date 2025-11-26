package com.sprintix.web.controller;

import com.sprintix.web.service.ApiService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;

@Controller
public class WebController {

    @Autowired
    private ApiService apiService;

    // --- LOGIN ---
    @GetMapping({"/", "/login", "/index.html"})
    public String loginPage(HttpSession session, Model model) {
        if (session.getAttribute("token") != null) {
            return "redirect:/dashboard";
        }
        return "index";
    }

    @PostMapping("/auth/login")
    public String processLogin(@RequestParam String email, 
                             @RequestParam String password, 
                             HttpSession session, 
                             Model model) {
        // Validación básica
        if (email == null || email.trim().isEmpty() || 
            password == null || password.trim().isEmpty()) {
            model.addAttribute("error", "Email y contraseña son requeridos");
            return "index";
        }

        String token = apiService.login(email, password);
        
        if (token != null) {
            session.setAttribute("token", token);
            Map usuario = apiService.getMe(token);
            
            if (usuario != null) {
                session.setAttribute("usuario", usuario);
                // Configurar timeout de sesión (opcional)
                session.setMaxInactiveInterval(3600); 
                return "redirect:/dashboard";
            }
        }
        
        model.addAttribute("error", "Credenciales inválidas");
        return "index";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session, RedirectAttributes redirectAttributes) {
        session.invalidate();
        redirectAttributes.addFlashAttribute("message", "Sesión cerrada exitosamente");
        return "redirect:/";
    }

    // --- DASHBOARD ---
    @GetMapping({"/dashboard", "/dashboard.html"})
    public String dashboard(HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";

        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        
        // Asegurarse de castear correctamente el ID (dependiendo de cómo venga el JSON, puede ser Integer o Double)
        int userId = (Integer) usuario.get("id");
        
        Map dashboardData = apiService.getDashboard(userId, token);

        if (dashboardData == null) {
            model.addAttribute("error", "No se pudo cargar el dashboard");
            // Podrías redirigir o mostrar página de error, pero 'dashboard' necesita 'stats'
            // Para evitar error 500 si falla la API, pasamos un mapa vacío o manejamos el error
            return "redirect:/logout"; 
        }

        model.addAttribute("usuario", usuario);
        model.addAttribute("stats", dashboardData);
        
        return "dashboard";
    }

    // --- PROYECTOS (FALTABA ESTE MÉTODO) ---
    @GetMapping("/proyectos")
    public String proyectos(HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";

        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");

        List<Map<String, Object>> proyectos = apiService.getProyectos(token);

        model.addAttribute("usuario", usuario);
        model.addAttribute("proyectos", proyectos);
        return "proyectos";
    }

    // --- BOARD / TABLERO (FALTABA ESTE MÉTODO) ---
    @GetMapping("/board")
    public String board(@RequestParam int id, HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";

        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");

        // Llamada a la API para obtener proyecto y tareas
        Map<String, Object> data = apiService.getTableroData(id, token);
        
        if (data == null || data.get("proyecto") == null) {
            model.addAttribute("error", "Proyecto no encontrado");
            return "redirect:/proyectos";
        }

        model.addAttribute("usuario", usuario);
        model.addAttribute("proyecto", data.get("proyecto"));
        
        // Clasificar tareas para las columnas
        List<Map> tareas = (List<Map>) data.get("tareas");
        
        model.addAttribute("tareasPendientes", 
            tareas.stream().filter(t -> isStatus(t, "pendiente")).toList());
        model.addAttribute("tareasEnCurso", 
            tareas.stream().filter(t -> isStatus(t, "en_progreso")).toList());
        model.addAttribute("tareasCompletadas", 
            tareas.stream().filter(t -> isStatus(t, "completada")).toList());

        return "board";
    }

    // --- HELPERS ---

    private boolean isValidSession(HttpSession session) {
        return session.getAttribute("token") != null && 
               session.getAttribute("usuario") != null;
    }

    private boolean isStatus(Map tarea, String estadoCheck) {
        Object estadoObj = tarea.get("estado");
        if (estadoObj == null) return false;
        String estado = estadoObj.toString().toLowerCase();
        
        return switch (estadoCheck) {
            case "pendiente" -> estado.equals("pendiente") || estado.equals("por hacer");
            case "en_progreso" -> estado.equals("en_progreso") || estado.equals("en curso");
            case "completada" -> estado.equals("completada") || estado.equals("listo") || estado.equals("finalizada");
            default -> false;
        };
    }
}