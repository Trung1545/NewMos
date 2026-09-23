package com.shoestore.repository;

import com.shoestore.entity.AIFitProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIFitProfileRepository extends JpaRepository<AIFitProfile, Long> {

    List<AIFitProfile> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<AIFitProfile> findByUserIdAndIsDefaultTrue(Long userId);
}
