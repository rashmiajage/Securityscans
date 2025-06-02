@Service
public class StudentService {

    private final WebClient webClient;

    public StudentService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://external.api.com").build(); // Replace with actual base URL
    }

    public Mono<Map<String, Object>> getStudentsGroupedBySection(InputRequest input) {
        List<String> sections = getSectionsForSchool(input.getSchool());

        return Flux.fromIterable(sections)
                .flatMap(section -> fetchStudentForSection(input.getIndex(), section)
                        .map(student -> Map.entry(section, student)))
                .collectList()
                .map(this::buildFinalResponse);
    }

    private List<String> getSectionsForSchool(String school) {
        return List.of("A", "B", "C", "D");
    }

    private Mono<StudentProfile> fetchStudentForSection(String index, String section) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/external/studentBySection")
                        .queryParam("index", index)
                        .queryParam("section", section)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    if (json.isArray() && !json.isEmpty()) {
                        JsonNode first = json.get(0);
                        return new StudentProfile(
                                first.path("studentId").asText(),
                                first.path("name").asText(),
                                first.path("email").asText(),
                                section,
                                first.path("mathMarks").asInt(0),
                                first.path("scienceMarks").asInt(0),
                                first.path("evsMarks").asInt(0),
                                first.path("englishMarks").asInt(0)
                        );
                    } else {
                        throw new RuntimeException("No students found for section: " + section);
                    }
                });
    }

    private Map<String, Object> buildFinalResponse(List<Map.Entry<String, StudentProfile>> studentList) {
        Map<String, Object> response = new LinkedHashMap<>();

        int totalStudents = studentList.size();
        int totalMath = 0, totalScience = 0, totalEvs = 0, totalEnglish = 0;

        for (Map.Entry<String, StudentProfile> entry : studentList) {
            StudentProfile s = entry.getValue();
            totalMath += s.getMathMarks();
            totalScience += s.getScienceMarks();
            totalEvs += s.getEvsMarks();
            totalEnglish += s.getEnglishMarks();
        }

        response.put("totalStudents", String.valueOf(totalStudents));
        response.put("Total math marks", String.valueOf(totalMath));
        response.put("Total science marks", String.valueOf(totalScience));
        response.put("Total evs marks", String.valueOf(totalEvs));
        response.put("Total english marks", String.valueOf(totalEnglish));

        for (Map.Entry<String, StudentProfile> entry : studentList) {
            StudentProfile s = entry.getValue();
            response.put(entry.getKey(), List.of(Map.of(
                    "studentId", s.getStudentId(),
                    "name", s.getName(),
                    "email", s.getEmail(),
                    "mathMarks", s.getMathMarks(),
                    "scienceMarks", s.getScienceMarks(),
                    "evsMarks", s.getEvsMarks(),
                    "englishMarks", s.getEnglishMarks()
            )));
        }

        return response;
    }
}
