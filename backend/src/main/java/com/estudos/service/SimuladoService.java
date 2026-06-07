package com.estudos.service;

import com.estudos.model.Simulado;
import com.estudos.repository.SimuladoHistoricoRepository;
import com.estudos.repository.SimuladoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SimuladoService {

    private final SimuladoRepository repository;
    private final SimuladoHistoricoRepository historicoRepository;

    public SimuladoService(SimuladoRepository repository, SimuladoHistoricoRepository historicoRepository) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
    }

    public List<Simulado> listar() {
        return repository.findAll();
    }

    public Simulado buscarPorId(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Simulado não encontrado com id: " + id));
    }

    public Simulado salvar(Simulado simulado) {
        simulado.setId(null);
        return repository.save(simulado);
    }

    public Simulado atualizar(String id, Simulado simulado) {
        Simulado existente = buscarPorId(id);
        existente.setNumero(simulado.getNumero());
        existente.setQuestoes(simulado.getQuestoes());
        existente.setDisciplinas(simulado.getDisciplinas());
        existente.setConteudos(simulado.getConteudos());
        return repository.save(existente);
    }

    public void excluir(String id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Simulado não encontrado com id: " + id);
        }
        // Remove em cascata os históricos vinculados a este simulado.
        historicoRepository.deleteBySimuladoId(id);
        repository.deleteById(id);
    }
}
