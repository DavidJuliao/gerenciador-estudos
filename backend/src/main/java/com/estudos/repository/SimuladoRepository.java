package com.estudos.repository;

import com.estudos.model.Simulado;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SimuladoRepository extends MongoRepository<Simulado, String> {
}
