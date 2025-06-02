package com.example.demo.service;

import com.example.demo.model.InputRequest;
import com.example.demo.model.UserProfile;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Service
public class UserService {

    private final WebClient webClient;

    public UserService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://external.api.com").build(); // Replace with actual base URL
    }

    public Mono<Map<String, Object>> getUsersGroupedByDepartment(InputRequest input) {
        List<String> departments = getDepartmentsForCompany(input.getCompany());

        return Flux.fromIterable(departments)
                .flatMap(department -> fetchUserForDepartment(input.getIndex(), department)
                        .map(user -> Map.entry(department, user)))
                .collectList()
                .map(this::buildFinalResponse);
    }

    private List<String> getDepartmentsForCompany(String company) {
        // You can customize this map per company if needed
        return List.of("Sales", "Marketing", "Engineering", "HR");
    }

    private Mono<UserProfile> fetchUserForDepartment(String index, String department) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/external/userByDepartment")
                        .queryParam("index", index)
                        .queryParam("department", department)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    if (json.isArray() && !json.isEmpty()) {
                        JsonNode first = json.get(0);
                        return new UserProfile(
                                first.path("userId").asText(),
                                first.path("name").asText(),
                                first.path("email").asText(),
                                department,
                                first.path("salary").asInt(0)
                        );
                    } else {
                        throw new RuntimeException("No users found for department: " + department);
                    }
                });
    }

    private Map<String, Object> buildFinalResponse(List<Map.Entry<String, UserProfile>> userList) {
        Map<String, Object> response = new LinkedHashMap<>();

        int totalUsers = userList.size();
        int totalSalary = userList.stream().mapToInt(e -> e.getValue().getSalary()).sum();

        response.put("totalUsers", String.valueOf(totalUsers));
        response.put("Total salary", String.valueOf(totalSalary));

        for (Map.Entry<String, UserProfile> entry : userList) {
            UserProfile u = entry.getValue();
            response.put(entry.getKey(), List.of(Map.of(
                    "userId", u.getUserId(),
                    "name", u.getName(),
                    "email", u.getEmail()
            )));
        }

        return response;
    }
}
