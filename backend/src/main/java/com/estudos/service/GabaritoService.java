package com.estudos.service;

import com.estudos.model.Gabarito;
import com.estudos.repository.GabaritoHistoricoRepository;
import com.estudos.repository.GabaritoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GabaritoService {

    private final GabaritoRepository repository;
    private final GabaritoHistoricoRepository historicoRepository;

    public GabaritoService(GabaritoRepository repository, GabaritoHistoricoRepository historicoRepository) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
    }

    public List<Gabarito> listar() {
        return repository.findAll();
    }

    public List<Gabarito> listarPorDisciplina(String disciplina) {
        return repository.findByDisciplina(disciplina);
    }

    public Gabarito buscarPorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gabarito não encontrado com id: " + id));
    }

    public Gabarito salvar(Gabarito gabarito) {
        gabarito.setId(null);
        return repository.save(gabarito);
    }

    public Gabarito atualizar(String id, Gabarito gabarito) {
        Gabarito existente = buscarPorId(id);
        existente.setNumero(gabarito.getNumero());
        existente.setDisciplina(gabarito.getDisciplina());
        existente.setConteudoId(gabarito.getConteudoId());
        existente.setQuestoes(gabarito.getQuestoes());
        return repository.save(existente);
    }

    public void excluir(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Gabarito não encontrado com id: " + id);
        }
        // Remove em cascata os históricos vinculados a este gabarito.
        historicoRepository.deleteByGabaritoId(id);
        repository.deleteById(id);
    }
}
