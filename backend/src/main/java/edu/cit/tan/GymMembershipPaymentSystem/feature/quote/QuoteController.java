package edu.cit.tan.GymMembershipPaymentSystem.feature.quote;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.tan.GymMembershipPaymentSystem.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quotes")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class QuoteController {

    private static final String ZENQUOTES_URL = "https://zenquotes.io/api/random";

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<Map<String, String>>> getDailyQuote() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String json = restTemplate.getForObject(ZENQUOTES_URL, String.class);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode first = root.get(0);

            Map<String, String> data = new HashMap<>();
            data.put("quote", first.get("q").asText());
            data.put("author", first.get("a").asText());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            // Fallback quote if external API is unreachable
            Map<String, String> fallback = new HashMap<>();
            fallback.put("quote", "The only bad workout is the one that didn't happen.");
            fallback.put("author", "FitLife Gym");
            return ResponseEntity.ok(ApiResponse.success(fallback));
        }
    }
}
