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
            session.setAttribute("usuario", apiService.getMe(token));
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
        
        int userId = ((Number) usuario.get("id")).intValue();
        model.addAttribute("usuario", usuario);
        model.addAttribute("stats", apiService.getDashboard(userId, token));
        return "dashboard";
    }

    @GetMapping("/proyectos")
    public String proyectos(HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";
        String token = (String) session.getAttribute("token");
        model.addAttribute("usuario", session.getAttribute("usuario"));
        model.addAttribute("proyectos", apiService.getProyectos(token));
        return "proyectos";
    }

    @GetMapping("/board")
    public String board(@RequestParam int id, HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";

        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");

        Map<String, Object> data = apiService.getTableroData(id, token);
        
        if (data == null || data.get("proyecto") == null) {
            return "redirect:/proyectos";
        }

        model.addAttribute("usuario", usuario);
        model.addAttribute("proyecto", data.get("proyecto"));
        
        List<Map<String, Object>> tareas = (List<Map<String, Object>>) data.get("tareas");
        
        // 🔍 LOGS DE DEPURACIÓN
        System.out.println("📋 Total tareas recibidas: " + (tareas != null ? tareas.size() : 0));
        
        if (tareas != null) {
            tareas.forEach(t -> {
                System.out.println("  - Tarea: " + t.get("titulo") + " | Estado: " + t.get("estado"));
                formatDateSafe(t);
            });
            
            List<Map<String, Object>> pendientes = filtrarPorEstado(tareas, "pendiente");
            List<Map<String, Object>> enCurso = filtrarPorEstado(tareas, "en_progreso");
            List<Map<String, Object>> completadas = filtrarPorEstado(tareas, "completada");
            
            System.out.println("✅ Pendientes: " + pendientes.size());
            System.out.println("⚙️ En Curso: " + enCurso.size());
            System.out.println("🎯 Completadas: " + completadas.size());
            
            model.addAttribute("tareasPendientes", pendientes);
            model.addAttribute("tareasEnCurso", enCurso);
            model.addAttribute("tareasCompletadas", completadas);
        } else {
            model.addAttribute("tareasPendientes", List.of());
            model.addAttribute("tareasEnCurso", List.of());
            model.addAttribute("tareasCompletadas", List.of());
        }

        return "board";
    }

    // --- HELPERS ROBUSTOS ---
    
    private List<Map<String, Object>> filtrarPorEstado(List<Map<String, Object>> tareas, String estadoBuscado) {
        if (tareas == null) return List.of();
        
        return tareas.stream().filter(t -> {
            Object estadoObj = t.get("estado");
            if (estadoObj == null) return false;
            
            // Normalizamos: minúsculas y sin espacios extra
            String estado = estadoObj.toString().toLowerCase().trim();
            
            // Mapeo más robusto de estados
            switch (estadoBuscado.toLowerCase()) {
                case "pendiente":
                    return estado.equals("pendiente") || 
                           estado.equals("por hacer") || 
                           estado.equals("por_hacer");
                case "en_progreso":
                    return estado.equals("en_progreso") || 
                           estado.equals("en curso") || 
                           estado.equals("en progreso") || 
                           estado.equals("en_curso");
                case "completada":
                    return estado.equals("completada") || 
                           estado.equals("completado") || 
                           estado.equals("listo") || 
                           estado.equals("finalizada");
                default:
                    return false;
            }
        }).collect(Collectors.toList());
    }

    private void formatDateSafe(Map<String, Object> tarea) {
        try {
            Object fechaObj = tarea.get("fecha_limite");
            String fechaStr = "";
            
            if (fechaObj != null) {
                if (fechaObj instanceof String) {
                    String s = (String) fechaObj;
                    // Intenta cortar formato ISO
                    if (s.length() >= 10) {
                        fechaStr = s.substring(8, 10) + "-" + s.substring(5, 7) + "-" + s.substring(0, 4);
                    } else {
                        fechaStr = s;
                    }
                } else if (fechaObj instanceof Number) {
                    // Si es timestamp
                    long ts = ((Number) fechaObj).longValue();
                    fechaStr = new SimpleDateFormat("dd-MM-yyyy").format(new Date(ts));
                }
            }
            
            tarea.put("fecha_formateada", fechaStr);
        } catch (Exception e) {
            System.err.println("⚠️ Error formateando fecha: " + e.getMessage());
            tarea.put("fecha_formateada", "");
        }
    }

    private boolean isValidSession(HttpSession session) {
        return session.getAttribute("token") != null;
    }
}