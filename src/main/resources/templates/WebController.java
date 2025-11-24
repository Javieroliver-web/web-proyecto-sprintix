package com.sprintix.web.controller;

import com.sprintix.web.service.ApiService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

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
        return "index"; // Busca templates/index.html
    }

    @PostMapping("/auth/login")
    public String processLogin(@RequestParam String email, @RequestParam String password, HttpSession session, Model model) {
        String token = apiService.login(email, password);
        
        if (token != null) {
            // Guardamos token y datos básicos en sesión
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

        if (token == null || usuario == null) return "redirect:/";

        // Llamada Servidor a Servidor para obtener datos
        int userId = (Integer) usuario.get("id");
        Map dashboardData = apiService.getDashboard(userId, token);

        // Pasamos los datos a la vista (Thymeleaf)
        model.addAttribute("usuario", usuario);
        model.addAttribute("stats", dashboardData);
        
        return "dashboard"; // Busca templates/dashboard.html
    }
}