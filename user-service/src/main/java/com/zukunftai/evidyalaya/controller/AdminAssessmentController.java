package com.zukunftai.evidyalaya.controller;
import com.zukunftai.evidyalaya.model.AdminAssessmentOverviewResponse;
import com.zukunftai.evidyalaya.service.impl.AdminAssessmentOverviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/assessments/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAssessmentController {
 private final AdminAssessmentOverviewService service;
 @GetMapping public List<AdminAssessmentOverviewResponse.Item> list(){return service.list();}
 @GetMapping("/{id}") public AdminAssessmentOverviewResponse.Detail detail(@PathVariable Long id){return service.detail(id);}
}
