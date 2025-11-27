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
        model.addAttribute("userId", userId);
        model.addAttribute("token", token);
        
        Map<String, Object> stats = apiService.getDashboard(userId, token);
        
        if (stats != null) {
            List<Map<String, Object>> proyectos = (List<Map<String, Object>>) stats.get("ultimosProyectos");
            if (proyectos != null) {
                for (Map<String, Object> p : proyectos) {
                    formatMapDate(p, "fecha_inicio", "fecha_inicio");
                }
            }
            List<Map<String, Object>> tareas = (List<Map<String, Object>>) stats.get("tareasProximas");
            if (tareas != null) {
                for (Map<String, Object> t : tareas) {
                    formatMapDate(t, "fecha_limite", "fecha_formateada");
                }
            }
        }
        
        model.addAttribute("stats", stats);
        return "dashboard";
    }

    @GetMapping("/proyectos")
    public String proyectos(HttpSession session, Model model) {
        if (!isValidSession(session)) return "redirect:/";
        
        String token = (String) session.getAttribute("token");
        Map usuario = (Map) session.getAttribute("usuario");
        int userId = ((Number) usuario.get("id")).intValue();
        
        model.addAttribute("usuario", usuario);
        model.addAttribute("userId", userId);
        model.addAttribute("token", token);
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
        model.addAttribute("userId", userId);
        model.addAttribute("token", token);
        model.addAttribute("proyecto", data.get("proyecto"));
        
        List<Map<String, Object>> tareas = (List<Map<String, Object>>) data.get("tareas");
        
        if (tareas != null) {
            for (Map<String, Object> t : tareas) {
                limpiarDatosTarea(t); 
                formatMapDate(t, "fecha_limite", "fecha_formateada");
            }
            
            model.addAttribute("tareasPendientes", filtrarPorEstado(tareas, "pendiente"));
            model.addAttribute("tareasEnCurso", filtrarPorEstado(tareas, "en_progreso"));
            model.addAttribute("tareasCompletadas", filtrarPorEstado(tareas, "completada"));
        }

        return "board";
    }

    // --- HELPERS CORREGIDOS ---

    /**
     * Formatea la fecha de manera inteligente.
     * Detecta si ya viene en formato dd-MM-yyyy para no romperla.
     */
    private void formatMapDate(Map<String, Object> map, String inputKey, String outputKey) {
        try {
            Object fechaObj = map.get(inputKey);
            String fechaStr = "";
            
            if (fechaObj != null) {
                if (fechaObj instanceof String) {
                    String s = (String) fechaObj;
                    
                    // CASO 1: Viene como ISO (yyyy-MM-dd...) -> Lo convertimos
                    // Comprobamos si el 4º caracter es un guion (ej: 2025-...)
                    if (s.length() >= 10 && s.charAt(4) == '-') {
                        fechaStr = s.substring(8, 10) + "-" + s.substring(5, 7) + "-" + s.substring(0, 4);
                    } 
                    // CASO 2: Ya viene bien (dd-MM-yyyy...) -> Lo dejamos tal cual
                    else {
                        fechaStr = s;
                    }
                } else if (fechaObj instanceof Number) {
                    // CASO 3: Timestamp numérico
                    long ts = ((Number) fechaObj).longValue();
                    fechaStr = new SimpleDateFormat("dd-MM-yyyy").format(new Date(ts));
                }
            }
            map.put(outputKey, fechaStr);
        } catch (Exception e) {
            map.put(outputKey, "");
        }
    }
    
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

    private boolean isValidSession(HttpSession session) {
        return session.getAttribute("token") != null;
    }
}