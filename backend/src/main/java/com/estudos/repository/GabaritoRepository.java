package com.estudos.repository;

import com.estudos.model.Gabarito;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface GabaritoRepository extends MongoRepository<Gabarito, String> {
    List<Gabarito> findByDisciplina(String disciplina);
}
