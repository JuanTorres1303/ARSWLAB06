package co.edu.eci.blueprints.api;

import co.edu.eci.blueprints.model.Blueprint;
import co.edu.eci.blueprints.model.Point;
import co.edu.eci.blueprints.persistence.BlueprintNotFoundException;
import co.edu.eci.blueprints.persistence.BlueprintPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Recibe los puntos dibujados en tiempo real (/app/draw), los guarda
 * y publica el plano completo a todos los suscritos al tópico del plano.
 */
@Controller
public class DrawController {

    private static final Logger log = LoggerFactory.getLogger(DrawController.class);

    public record DrawEvent(String author, String name, Point point) {}

    private final BlueprintPersistence persistence;
    private final SimpMessagingTemplate template;

    public DrawController(BlueprintPersistence persistence, SimpMessagingTemplate template) {
        this.persistence = persistence;
        this.template = template;
    }

    @MessageMapping("/draw")
    public void draw(DrawEvent ev) {
        if (ev.author() == null || ev.name() == null || ev.point() == null) return;
        try {
            persistence.addPoint(ev.author(), ev.name(), ev.point().x(), ev.point().y());
            Blueprint updated = persistence.getBlueprint(ev.author(), ev.name());
            String topic = "/topic/blueprints." + ev.author() + "." + ev.name();
            template.convertAndSend(topic, updated);
            log.info("draw {} -> {} ({} puntos)", ev.point(), topic, updated.getPoints().size());
        } catch (BlueprintNotFoundException e) {
            log.warn("draw ignorado: {}", e.getMessage());
        }
    }
}
