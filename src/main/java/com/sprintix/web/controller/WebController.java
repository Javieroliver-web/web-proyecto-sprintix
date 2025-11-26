package com.sprintix.web.controller;

import com.sprintix.web.service.ApiService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class WebController {

    @Autowired
    private ApiService apiService;

    @GetMapping({"/", "/login", "/index.html"})
    public String loginPage(HttpSession session) {
        if (session.getAttribute("token") != null) return "redirect:/dashboard";
        return "index";
    }

    @PostMapping("/auth/login")
    public String processLogin(@RequestParam String email, @RequestParam String password, HttpSession session, Model model) {
        String token = apiService.login(email, password);
        if (token != null) {
            session.setAttribute("token", token);
            Map usuario = apiService.getMe(token);
            session.setAttribute("usuario", usuario);
            
            // ⭐ DEBUGGING: Verifica que los datos estén en sesión
            System.out.println("✅ Login exitoso:");
            System.out.println("   - Token: " + token.substring(0, 20) + "...");
            System.out.println("   - Usuario ID: " + usuario.get("id"));
            System.out.println("   - Usuario Nombre: " + usuario.get("nombre"));
            
            return "redirect:/dashboard";
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

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";
        
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        
        // ⭐ ASEGURAR QUE LAS VARIABLES SE PASEN CORRECTAMENTE
        int userId = ((Number) usuario.get("id")).intValue();
        
        model.addAttribute("usuario", usuario);
        model.addAttribute("userId", userId); // ⭐ NUEVO: Pasar explícitamente
        model.addAttribute("token", token);   // ⭐ NUEVO: Pasar explícitamente
        model.addAttribute("stats", apiService.getDashboard(userId, token));
        
        // ⭐ DEBUGGING
        System.out.println("📊 Dashboard cargado:");
        System.out.println("   - User ID: " + userId);
        System.out.println("   - Token presente: " + (token != null));
        
        return "dashboard";
    }

    @GetMapping("/proyectos")
    public String proyectos(HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";
        
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        int userId = ((Number) usuario.get("id")).intValue();
        
        model.addAttribute("usuario", usuario);
        model.addAttribute("userId", userId);  // ⭐ NUEVO
        model.addAttribute("token", token);    // ⭐ NUEVO
        model.addAttribute("proyectos", apiService.getProyectos(token));
        
        return "proyectos";
    }

    @GetMapping("/board")
    public String board(@RequestParam int id, HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";

        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        int userId = ((Number) usuario.get("id")).intValue();

        Map<String, Object> data = apiService.getTableroData(id, token);
        
        if (data == null || data.get("proyecto") == null) {
            return "redirect:/proyectos";
        }

        model.addAttribute("usuario", usuario);
        model.addAttribute("userId", userId);  // ⭐ NUEVO
        model.addAttribute("token", token);    // ⭐ NUEVO
        model.addAttribute("proyecto", data.get("proyecto"));
        
        List<Map<String, Object>> tareas = (List<Map<String, Object>>) data.get("tareas");
        
        if (tareas != null) {
            for (Map<String, Object> t : tareas) {
                limpiarDatosTarea(t); 
                formatDateSafe(t);
            }
            
            model.addAttribute("tareasPendientes", filtrarPorEstado(tareas, "pendiente"));
            model.addAttribute("tareasEnCurso", filtrarPorEstado(tareas, "en_progreso"));
            model.addAttribute("tareasCompletadas", filtrarPorEstado(tareas, "completada"));
        }

        return "board";
    }

    // --- HELPERS ---
    
    private void limpiarDatosTarea(Map<String, Object> t) {
        if (!t.containsKey("titulo") || t.get("titulo") == null) t.put("titulo", "Sin título");
        if (!t.containsKey("descripcion") || t.get("descripcion") == null) t.put("descripcion", "");
    }

    private List<Map<String, Object>> filtrarPorEstado(List<Map<String, Object>> tareas, String estadoBuscado) {
        return tareas.stream().filter(t -> {
            Object estadoObj = t.get("estado");
            if (estadoObj == null) return false;
            String estado = estadoObj.toString().toLowerCase().trim();
            
            if (estadoBuscado.equals("pendiente")) return estado.equals("pendiente") || estado.equals("por hacer");
            if (estadoBuscado.equals("en_progreso")) return estado.equals("en_progreso") || estado.equals("en curso");
            if (estadoBuscado.equals("completada")) return estado.equals("completada") || estado.equals("listo");
            return false;
        }).collect(Collectors.toList());
    }

    private void formatDateSafe(Map<String, Object> tarea) {
        try {
            Object fechaObj = tarea.get("fecha_limite");
            String fechaStr = "";
            if (fechaObj != null) {
                if (fechaObj instanceof String) {
                    String s = (String) fechaObj;
                    fechaStr = s.length() >= 10 ? s.substring(8, 10) + "-" + s.substring(5, 7) + "-" + s.substring(0, 4) : s;
                } else if (fechaObj instanceof Number) {
                    long ts = ((Number) fechaObj).longValue();
                    fechaStr = new SimpleDateFormat("dd-MM-yyyy").format(new Date(ts));
                }
            }
            tarea.put("fecha_formateada", fechaStr);
        } catch (Exception e) {
            tarea.put("fecha_formateada", "");
        }
    }

    private boolean isValidSession(HttpSession session) {
        return session.getAttribute("token") != null;
    }
}