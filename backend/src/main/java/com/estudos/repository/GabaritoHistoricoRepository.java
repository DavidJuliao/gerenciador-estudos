package com.estudos.repository;

import com.estudos.model.GabaritoHistorico;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface GabaritoHistoricoRepository extends MongoRepository<GabaritoHistorico, String> {
    List<GabaritoHistorico> findByGabaritoId(String gabaritoId);
    void deleteByGabaritoId(String gabaritoId);
}
