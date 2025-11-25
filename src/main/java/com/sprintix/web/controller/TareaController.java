package com.sprintix.controller;

import com.sprintix.dto.TareaCreateDTO;
import com.sprintix.entity.Proyecto;
import com.sprintix.entity.Tarea;
import com.sprintix.service.ProyectoService;
import com.sprintix.service.TareaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tareas")
public class TareaController {

    @Autowired
    private TareaService tareaService;

    @Autowired
    private ProyectoService proyectoService;

    @GetMapping("/proyecto/{proyectoId}")
    public List<Tarea> listarPorProyecto(@PathVariable int proyectoId, 
                                         @RequestParam(required = false) String estado) {
        return tareaService.listarPorProyecto(proyectoId, estado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tarea> obtenerPorId(@PathVariable int id) {
        return tareaService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crearTarea(@RequestBody TareaCreateDTO createDTO) {
        try {
            System.out.println("📥 Recibiendo tarea:");
            System.out.println("   Título: " + createDTO.getTitulo());
            System.out.println("   Estado: " + createDTO.getEstado());
            System.out.println("   Proyecto ID: " + createDTO.getProyecto_id());

            // Validaciones
            if (createDTO.getTitulo() == null || createDTO.getTitulo().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "El título es obligatorio"));
            }

            if (createDTO.getProyecto_id() == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "El proyecto_id es obligatorio"));
            }

            // Buscar proyecto
            Proyecto proyecto = proyectoService.obtenerPorId(createDTO.getProyecto_id())
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado con ID: " + createDTO.getProyecto_id()));

            // Crear tarea
            Tarea tarea = new Tarea();
            tarea.setTitulo(createDTO.getTitulo());
            tarea.setDescripcion(createDTO.getDescripcion());
            tarea.setEstado(createDTO.getEstado() != null ? createDTO.getEstado() : "pendiente");
            tarea.setFecha_limite(createDTO.getFecha_limite());
            tarea.setProyecto(proyecto);

            // Guardar
            Tarea nuevaTarea = tareaService.guardar(tarea);
            
            System.out.println("✅ Tarea creada con ID: " + nuevaTarea.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaTarea);

        } catch (RuntimeException e) {
            System.err.println("❌ Error al crear tarea: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error interno del servidor: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable int id, @RequestBody Map<String, Object> updates) {
        try {
            Tarea tarea = tareaService.obtenerPorId(id)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));

            if (updates.containsKey("titulo")) {
                tarea.setTitulo((String) updates.get("titulo"));
            }
            if (updates.containsKey("descripcion")) {
                tarea.setDescripcion((String) updates.get("descripcion"));
            }
            if (updates.containsKey("estado")) {
                tarea.setEstado((String) updates.get("estado"));
            }

            Tarea actualizada = tareaService.guardar(tarea);
            return ResponseEntity.ok(actualizada);

        } catch (Exception e) {
            System.err.println("❌ Error al actualizar tarea: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/asignar")
    public ResponseEntity<?> asignarUsuario(@PathVariable int id, @RequestBody Map<String, Integer> body) {
        Integer usuarioId = body.get("usuario_id");
        if (usuarioId == null) return ResponseEntity.badRequest().body("usuario_id requerido");

        try {
            Tarea tareaActualizada = tareaService.asignarUsuario(id, usuarioId);
            return ResponseEntity.ok(tareaActualizada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/asignar/{usuarioId}")
    public ResponseEntity<?> desasignarUsuario(@PathVariable int id, @PathVariable int usuarioId) {
        try {
            tareaService.desasignarUsuario(id, usuarioId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/usuario/{usuarioId}/asignadas")
    public List<Tarea> listarAsignadas(@PathVariable int usuarioId) {
        return tareaService.listarAsignadasPorUsuario(usuarioId);
    }

    @GetMapping("/usuario/{usuarioId}/favoritas")
    public List<Tarea> listarFavoritas(@PathVariable int usuarioId) {
        return tareaService.listarFavoritasPorUsuario(usuarioId);
    }

    @PostMapping("/{id}/favorito")
    public ResponseEntity<?> agregarAFavoritos(@PathVariable int id, @RequestBody Map<String, Integer> body) {
        Integer usuarioId = body.get("usuario_id");
        if (usuarioId == null) return ResponseEntity.badRequest().body("usuario_id requerido");
        try {
            Tarea tarea = tareaService.marcarComoFavorita(id, usuarioId);
            return ResponseEntity.ok(tarea);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/favorito/{usuarioId}")
    public ResponseEntity<?> eliminarDeFavoritos(@PathVariable int id, @PathVariable int usuarioId) {
        try {
            tareaService.eliminarDeFavoritos(id, usuarioId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable int id) {
        tareaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}