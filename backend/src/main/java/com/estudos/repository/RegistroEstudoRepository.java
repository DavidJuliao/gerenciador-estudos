package com.estudos.repository;

import com.estudos.model.RegistroEstudo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface RegistroEstudoRepository extends MongoRepository<RegistroEstudo, String> {

    // ATENÇÃO: o derived query `findByDataBetween` do Spring Data MongoDB usa
    // $gt / $lt (exclusivo nas duas pontas), o que faz registros caindo
    // exatamente em `inicio` (segunda) ou `fim` (domingo) sumirem.
    // Usamos @Query explícita com $gte / $lte para incluir as bordas.
    @Query("{ 'data': { $gte: ?0, $lte: ?1 } }")
    List<RegistroEstudo> findNoIntervalo(LocalDate inicio, LocalDate fim);
}
