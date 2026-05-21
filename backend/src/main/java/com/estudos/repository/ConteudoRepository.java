package com.estudos.repository;

import com.estudos.model.Conteudo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ConteudoRepository extends MongoRepository<Conteudo, String> {
    List<Conteudo> findByDisciplina(String disciplina);
}
