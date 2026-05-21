package com.estudos.repository;

import com.estudos.model.Disciplina;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DisciplinaRepository extends MongoRepository<Disciplina, String> {
    List<Disciplina> findByGrupo(Integer grupo);
}
