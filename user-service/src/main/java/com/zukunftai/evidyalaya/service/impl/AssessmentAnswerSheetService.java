package com.zukunftai.evidyalaya.service.impl;
import com.zukunftai.evidyalaya.database.*;
import com.zukunftai.evidyalaya.exception.APIException;
import com.zukunftai.evidyalaya.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class AssessmentAnswerSheetService {
 private final AssessmentAttemptRepository attempts; private final AssessmentAnswerRepository answers; private final UserRepository users;
 @Value("${app.assessment-storage-dir:uploads/assessments}") private String storageDirectory;
 public AssessmentAnswerSheetService(AssessmentAttemptRepository attempts,AssessmentAnswerRepository answers,UserRepository users){this.attempts=attempts;this.answers=answers;this.users=users;}
 public String upload(Long attemptId,Long questionId,MultipartFile file){
  User student=currentUser(); AssessmentAttempt attempt=attempts.findByIdAndStudent(attemptId,student)
   .orElseThrow(()->error("Attempt not found.",HttpStatus.NOT_FOUND,"ASSESSMENT_ATTEMPT_NOT_FOUND"));
  if(attempt.getStatus()!=AssessmentAttemptStatus.IN_PROGRESS||!Instant.now().isBefore(attempt.getDeadlineAt()))
   throw error("Answer sheets can only be uploaded during an active attempt.",HttpStatus.CONFLICT,"ASSESSMENT_ATTEMPT_CLOSED");
  AssessmentQuestion question=attempt.getAssessment().getId().equals(attempts.findById(attemptId).orElseThrow().getAssessment().getId())
   ? answers.findByAttemptIdAndQuestionId(attemptId,questionId).map(AssessmentAnswer::getQuestion).orElse(null):null;
  if(question==null) throw error("Save an answer for this question before uploading its sheet.",HttpStatus.BAD_REQUEST,"ASSESSMENT_ANSWER_REQUIRED");
  if(file==null||file.isEmpty()) throw error("Choose a non-empty file.",HttpStatus.BAD_REQUEST,"ANSWER_SHEET_REQUIRED");
  if(file.getSize()>25L*1024*1024) throw error("Answer sheets must be 25 MB or smaller.",HttpStatus.PAYLOAD_TOO_LARGE,"ANSWER_SHEET_TOO_LARGE");
  String name=StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(),"answer-sheet"));
  if(name.isBlank()||name.contains("..")||name.contains("/")||name.contains("\\")) throw error("Invalid filename.",HttpStatus.BAD_REQUEST,"INVALID_ANSWER_SHEET_NAME");
  String type=Objects.requireNonNullElse(file.getContentType(),"").toLowerCase(Locale.ROOT);
  if(!Set.of("application/pdf","image/jpeg","image/png").contains(type)) throw error("Only PDF, JPG and PNG answer sheets are accepted.",HttpStatus.BAD_REQUEST,"ANSWER_SHEET_TYPE_NOT_ALLOWED");
  String ext=type.equals("application/pdf")?".pdf":type.equals("image/png")?".png":".jpg";
  String stored=UUID.randomUUID()+ext; Path root=Paths.get(storageDirectory).toAbsolutePath().normalize();Path target=root.resolve(stored).normalize();
  try{Files.createDirectories(root);Files.copy(file.getInputStream(),target,StandardCopyOption.REPLACE_EXISTING);}
  catch(IOException e){throw error("Could not store answer sheet.",HttpStatus.INTERNAL_SERVER_ERROR,"ANSWER_SHEET_STORAGE_FAILED");}
  AssessmentAnswer answer=answers.findByAttemptIdAndQuestionId(attemptId,questionId).orElseThrow();
  delete(answer.getAttachmentPath());answer.setAttachmentPath(stored);answer.setAttachmentName(name);answer.setAttachmentContentType(type);answer.setAttachmentSize(file.getSize());answer.setUpdatedAt(Instant.now());answers.save(answer);
  return name;
 }
 @Transactional(readOnly=true)
 public Path download(Long attemptId,Long questionId){
  AssessmentAttempt attempt=attempts.findById(attemptId).orElseThrow(()->error("Attempt not found.",HttpStatus.NOT_FOUND,"ASSESSMENT_ATTEMPT_NOT_FOUND"));
  User user=currentUser();Authentication auth=SecurityContextHolder.getContext().getAuthentication();
  boolean admin=auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
  boolean faculty=attempt.getAssessment().getFaculty().getId().equals(user.getId());
  boolean student=attempt.getStudent().getId().equals(user.getId());
  if(!admin&&!faculty&&!student) throw error("You cannot access this answer sheet.",HttpStatus.FORBIDDEN,"ANSWER_SHEET_FORBIDDEN");
  AssessmentAnswer answer=answers.findByAttemptIdAndQuestionId(attemptId,questionId)
   .orElseThrow(()->error("Answer sheet not found.",HttpStatus.NOT_FOUND,"ANSWER_SHEET_NOT_FOUND"));
  if(answer.getAttachmentPath()==null) throw error("Answer sheet not found.",HttpStatus.NOT_FOUND,"ANSWER_SHEET_NOT_FOUND");
  Path root=Paths.get(storageDirectory).toAbsolutePath().normalize();Path path=root.resolve(answer.getAttachmentPath()).normalize();
  if(!path.startsWith(root)||!Files.isRegularFile(path)) throw error("Answer sheet not found.",HttpStatus.NOT_FOUND,"ANSWER_SHEET_NOT_FOUND");
  return path;
 }
 private void delete(String stored){if(stored==null)return;try{Path root=Paths.get(storageDirectory).toAbsolutePath().normalize();Path p=root.resolve(stored).normalize();if(p.startsWith(root))Files.deleteIfExists(p);}catch(Exception ignored){}}
 private User currentUser(){Authentication a=SecurityContextHolder.getContext().getAuthentication();if(a==null||!a.isAuthenticated())throw error("Not authenticated.",HttpStatus.UNAUTHORIZED,"USER_NOT_AUTHENTICATED");return users.findByUsername(a.getName()).orElseThrow(()->error("User not found.",HttpStatus.UNAUTHORIZED,"USER_NOT_FOUND"));}
 private APIException error(String m,HttpStatus s,String c){return new APIException(m,s,c);}
}
