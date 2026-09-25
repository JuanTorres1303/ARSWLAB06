package co.edu.eci.blueprints.api;

import co.edu.eci.blueprints.model.Blueprint;
import co.edu.eci.blueprints.model.Point;
import co.edu.eci.blueprints.persistence.BlueprintNotFoundException;
import co.edu.eci.blueprints.persistence.BlueprintPersistence;
import co.edu.eci.blueprints.persistence.BlueprintPersistenceException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/blueprints")
public class BlueprintController {

    public record BlueprintRequest(String author, String name, List<Point> points) {
    }

    private final BlueprintPersistence persistence;

    public BlueprintController(BlueprintPersistence persistence) {
        this.persistence = persistence;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_blueprints.read')")
    public Set<Blueprint> getAll() {
        return persistence.getAllBlueprints();
    }

    @GetMapping("/{author}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.read')")
    public Set<Blueprint> getByAuthor(@PathVariable String author) {
        try {
            return persistence.getBlueprintsByAuthor(author);
        } catch (BlueprintNotFoundException e) {
            return Set.of();
        }
    }

    @GetMapping("/{author}/{name}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.read')")
    public ResponseEntity<Blueprint> getOne(@PathVariable String author, @PathVariable String name) {
        try {
            return ResponseEntity.ok(persistence.getBlueprint(author, name));
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SCOPE_blueprints.write')")
    public ResponseEntity<?> create(@RequestBody BlueprintRequest in) {
        if (in.author() == null || in.name() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "author y name son obligatorios"));
        }
        try {
            Blueprint bp = new Blueprint(in.author(), in.name(), in.points());
            persistence.saveBlueprint(bp);
            return ResponseEntity.status(201).body(bp);
        } catch (BlueprintPersistenceException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{author}/{name}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.write')")
    public ResponseEntity<Blueprint> update(@PathVariable String author, @PathVariable String name,
            @RequestBody BlueprintRequest in) {
        try {
            persistence.updateBlueprint(author, name, in.points());
            return ResponseEntity.ok(persistence.getBlueprint(author, name));
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{author}/{name}")
    @PreAuthorize("hasAuthority('SCOPE_blueprints.write')")
    public ResponseEntity<Void> delete(@PathVariable String author, @PathVariable String name) {
        try {
            persistence.deleteBlueprint(author, name);
            return ResponseEntity.noContent().build();
        } catch (BlueprintNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}