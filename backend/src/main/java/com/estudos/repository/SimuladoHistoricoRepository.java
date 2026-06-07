package com.estudos.repository;

import com.estudos.model.SimuladoHistorico;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SimuladoHistoricoRepository extends MongoRepository<SimuladoHistorico, String> {
    List<SimuladoHistorico> findBySimuladoId(String simuladoId);
    void deleteBySimuladoId(String simuladoId);
}
