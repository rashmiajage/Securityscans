package com.example.demo.service;

import com.example.demo.model.InputRequest;
import com.example.demo.model.UserProfile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Service
public class UserService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public UserService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl("https://external.api.com").build(); // Change to real API
        this.objectMapper = objectMapper;
    }

    // Entry point from controller
    public Mono<Map<String, Object>> getUsersGroupedByDepartment(InputRequest input) {
        // Step 1: Get list of departments for the company
        return fetchDepartments(input.getCompany())
                .flatMapMany(Flux::fromIterable)
                .flatMap(department -> fetchUserForDepartment(input.getIndex(), department)
                        .map(user -> Map.entry(department, user)))
                .collectList()
                .map(this::buildFinalResponse);
    }

    // Mock or real GET call to get departments under the company
    private Mono<List<String>> fetchDepartments(String company) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/departments")
                        .queryParam("company", company)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    List<String> depts = new ArrayList<>();
                    if (json.isArray()) {
                        json.forEach(node -> {
                            String name = node.asText();
                            if (!name.isEmpty()) depts.add(name);
                        });
                    }
                    return depts;
                });
    }

    // Fetch one user for a given department
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
                        JsonNode first = json.get(0); // Pick first user
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

    // Assemble the final JSON response
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
