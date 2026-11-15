package com.zukunftai.evidyalaya.controller;
import com.zukunftai.evidyalaya.service.impl.AssessmentAnswerSheetService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Map;
@RestController
@RequestMapping("/assessments")
@RequiredArgsConstructor
public class AssessmentAnswerSheetController {
 private final AssessmentAnswerSheetService service;
 @PostMapping(path="/student/attempts/{attemptId}/answers/{questionId}/attachment",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 @PreAuthorize("hasRole('STUDENT')")
 public Map<String,String> upload(@PathVariable Long attemptId,@PathVariable Long questionId,@RequestParam("file") MultipartFile file){
  return Map.of("attachmentName",service.upload(attemptId,questionId,file));
 }
 @GetMapping("/attempts/{attemptId}/answers/{questionId}/attachment")
 @PreAuthorize("hasAnyRole('STUDENT','FACULTY','ADMIN')")
 public ResponseEntity<Resource> download(@PathVariable Long attemptId,@PathVariable Long questionId)throws Exception{
  Path path=service.download(attemptId,questionId);Resource resource=new UrlResource(path.toUri());
  return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
   .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(path.getFileName().toString(),StandardCharsets.UTF_8).build().toString()).body(resource);
 }
}
