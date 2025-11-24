package com.sprintix.web.controller;

import com.sprintix.web.service.ApiService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
public class WebController {

    @Autowired
    private ApiService apiService;

    // --- LOGIN ---
    @GetMapping({"/", "/login", "/index.html"})
    public String loginPage(HttpSession session) {
        if (session.getAttribute("token") != null) {
            return "redirect:/dashboard";
        }
        return "index";
    }

    @PostMapping("/auth/login")
    public String processLogin(@RequestParam String email, @RequestParam String password, HttpSession session, Model model) {
        String token = apiService.login(email, password);
        if (token != null) {
            session.setAttribute("token", token);
            Map usuario = apiService.getMe(token);
            session.setAttribute("usuario", usuario);
            return "redirect:/dashboard";
        } else {
            model.addAttribute("error", "Credenciales inválidas");
            return "index";
        }
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }

    // --- DASHBOARD ---
    @GetMapping({"/dashboard", "/dashboard.html"})
    public String dashboard(HttpSession session, Model model) {
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        if (token == null) return "redirect:/";

        int userId = (Integer) usuario.get("id");
        Map dashboardData = apiService.getDashboard(userId, token);

        model.addAttribute("usuario", usuario);
        model.addAttribute("stats", dashboardData);
        
        return "dashboard";
    }

    // --- PROYECTOS (NUEVO) ---
    @GetMapping("/proyectos")
    public String proyectos(HttpSession session, Model model) {
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        if (token == null) return "redirect:/";

        // Pedimos la lista al servicio
        List<Map<String, Object>> proyectos = apiService.getProyectos(token);

        model.addAttribute("usuario", usuario);
        model.addAttribute("proyectos", proyectos);
        return "proyectos";
    }

    // --- BOARD / TABLERO (NUEVO) ---
    @GetMapping("/board")
    public String board(@RequestParam int id, HttpSession session, Model model) {
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        if (token == null) return "redirect:/";

        Map<String, Object> data = apiService.getTableroData(id, token);
        
        if (data == null) return "redirect:/proyectos";

        model.addAttribute("usuario", usuario);
        model.addAttribute("proyecto", data.get("proyecto"));
        
        // Separamos las tareas por estado para pintarlas fácil en el HTML
        List<Map> tareas = (List<Map>) data.get("tareas");
        model.addAttribute("tareasPendientes", tareas.stream().filter(t -> isStatus(t, "pendiente")).toList());
        model.addAttribute("tareasEnCurso", tareas.stream().filter(t -> isStatus(t, "en_progreso")).toList());
        model.addAttribute("tareasCompletadas", tareas.stream().filter(t -> isStatus(t, "completada")).toList());

        return "board";
    }

    // Helper para filtrar estados en el controller
    private boolean isStatus(Map tarea, String estadoCheck) {
        String estado = (String) tarea.get("estado");
        if (estado == null) return false;
        estado = estado.toLowerCase();
        if (estadoCheck.equals("pendiente")) return estado.equals("pendiente") || estado.equals("por hacer");
        if (estadoCheck.equals("en_progreso")) return estado.equals("en_progreso") || estado.equals("en curso");
        if (estadoCheck.equals("completada")) return estado.equals("completada") || estado.equals("listo");
        return false;
    }
}