'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Minus, ExternalLink, Users, Plus, Trash2, BarChart3 } from 'lucide-react';
import { submitAudit, getHistory, getSalesReps, createSalesRep, deleteSalesRep, seedDefaultReps } from './actions';

// Flash test objections
const OBJECTIONS = [
    "C'est trop cher pour nous.",
    "On n'a pas le budget cette année.",
    "Je dois en parler à mon équipe d'abord.",
    "Envoyez-moi une proposition par email.",
    "On travaille déjà avec un concurrent.",
];

export default function Home() {
    const [step, setStep] = useState(0);
    const [managerEmail, setManagerEmail] = useState('');
    const [salesRepName, setSalesRepName] = useState('');
    const [salesRepId, setSalesRepId] = useState('');
    const [salesReps, setSalesReps] = useState<any[]>([]);
    const [prospectingActions, setProspectingActions] = useState('');
    const [discoveryMeetings, setDiscoveryMeetings] = useState('');
    const [proposalsSent, setProposalsSent] = useState('');
    const [signedProposals, setSignedProposals] = useState('');
    const [revenue, setRevenue] = useState('');
    const [flashTestObjection, setFlashTestObjection] = useState('');
    const [flashTestResponse, setFlashTestResponse] = useState('');
    const [flashTestPassed, setFlashTestPassed] = useState(false);
    const [recognitionNote, setRecognitionNote] = useState('');
    const [totalScore, setTotalScore] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
    const [trendPercentage, setTrendPercentage] = useState(0);

    // Sales rep management
    const [showRepDialog, setShowRepDialog] = useState(false);
    const [newRepName, setNewRepName] = useState('');
    const [newRepEmail, setNewRepEmail] = useState('');

    useEffect(() => {
        loadSalesReps();
    }, []);

    useEffect(() => {
        if (step === 2) {
            const randomObjection = OBJECTIONS[Math.floor(Math.random() * OBJECTIONS.length)];
            setFlashTestObjection(randomObjection);
        }
    }, [step]);

    const loadSalesReps = async () => {
        try {
            // Try to seed default reps first
            await seedDefaultReps();

            const result = await getSalesReps();
            if (result.success && result.data) {
                setSalesReps(result.data);
            } else {
                // Fallback to local data if DB not configured
                setSalesReps([
                    { id: '1', name: 'Thomas', email: 'thomas@example.com' },
                    { id: '2', name: 'Julie', email: 'julie@example.com' },
                ]);
            }
        } catch (error) {
            // Fallback to local data
            setSalesReps([
                { id: '1', name: 'Thomas', email: 'thomas@example.com' },
                { id: '2', name: 'Julie', email: 'julie@example.com' },
            ]);
        }
    };

    const handleAddRep = async () => {
        if (!newRepName) return;

        // Optimistic update for better UX
        const tempId = Date.now().toString();
        const newRep = { id: tempId, name: newRepName, email: newRepEmail };

        try {
            // Close dialog immediately
            setShowRepDialog(false);
            setNewRepName('');
            setNewRepEmail('');

            // Try DB
            const result = await createSalesRep(newRepName, newRepEmail);
            if (result.success) {
                await loadSalesReps();
            } else {
                // If DB fails (e.g. no connection), keep local state
                setSalesReps(prev => [...prev, newRep]);
            }
        } catch (error) {
            console.warn('Could not add rep to database, adding locally');
            setSalesReps(prev => [...prev, newRep]);
        }
    };

    const handleDeleteRep = async (id: string) => {
        try {
            await deleteSalesRep(id);
            await loadSalesReps();
        } catch (error) {
            console.warn('Could not delete from database, removing locally');
            setSalesReps(salesReps.filter(rep => rep.id !== id));
        }
    };

    const calculateScore = () => {
        const kpiScore = Math.min(
            (parseInt(prospectingActions || '0') * 1 +
                parseInt(discoveryMeetings || '0') * 3 +
                parseInt(proposalsSent || '0') * 5 +
                parseInt(signedProposals || '0') * 8 +
                parseInt(revenue || '0') / 1000) / 3,
            40
        );
        const flashScore = flashTestPassed ? 30 : 0;
        const recognitionScore = recognitionNote.length > 10 ? 30 : 0;
        return Math.round(kpiScore + flashScore + recognitionScore);
    };

    const handleNext = async () => {
        if (step === 3) {
            const score = calculateScore();
            setTotalScore(score);

            try {
                const auditData = {
                    managerEmail,
                    salesRepName,
                    salesRepId,
                    prospectingActions: parseInt(prospectingActions || '0'),
                    discoveryMeetings: parseInt(discoveryMeetings || '0'),
                    proposalsSent: parseInt(proposalsSent || '0'),
                    signedProposals: parseInt(signedProposals || '0'),
                    revenue: parseInt(revenue || '0'),
                    flashTestObjection,
                    flashTestPassed,
                    recognitionNote,
                    totalScore: score,
                    createdAt: new Date(),
                };

                // Save to localStorage for immediate fallback
                const localAudits = JSON.parse(localStorage.getItem('sales_pulse_audits') || '[]');
                localAudits.push({ ...auditData, id: Date.now().toString() });
                localStorage.setItem('sales_pulse_audits', JSON.stringify(localAudits));

                await submitAudit(auditData);

                const historyResult = await getHistory(managerEmail, salesRepName);
                if (historyResult.success && historyResult.data) {
                    const historyData = historyResult.data.reverse().map((item, index) => ({
                        week: `S${index + 1}`,
                        score: item.totalScore,
                    }));
                    setHistory(historyData);

                    if (historyData.length >= 2) {
                        const current = historyData[historyData.length - 1].score;
                        const previous = historyData[historyData.length - 2].score;
                        const diff = current - previous;
                        const percentage = Math.round((diff / previous) * 100);
                        setTrendPercentage(Math.abs(percentage));

                        if (diff > 5) setTrend('up');
                        else if (diff < -5) setTrend('down');
                        else setTrend('stable');
                    }
                }
            } catch (error) {
                console.warn('Database not configured. Continuing without history tracking.');
            }
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const canProceed = () => {
        switch (step) {
            case 0:
                return managerEmail.includes('@') && salesRepName.length > 0;
            case 1:
                return prospectingActions && discoveryMeetings && proposalsSent;
            case 2:
                return flashTestResponse.length > 10;
            case 3:
                return recognitionNote.length > 0;
            default:
                return true;
        }
    };

    const progress = ((step + 1) / 5) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-white text-center mb-2">
                        Sales Weekly Pulse
                    </h1>
                    <p className="text-slate-300 text-center">
                        Auditez votre équipe commerciale en 3 minutes
                    </p>
                    <Progress value={progress} className="mt-4" />
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Qui auditez-vous cette semaine ?</CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Sélectionnez le commercial et votre email pour suivre sa progression
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="salesRep" className="text-white">Commercial</Label>
                                        <div className="flex gap-2">
                                            <Select value={salesRepName} onValueChange={(value) => {
                                                setSalesRepName(value);
                                                const rep = salesReps.find(r => r.name === value);
                                                if (rep) setSalesRepId(rep.id);
                                            }}>
                                                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                                                    <SelectValue placeholder="Sélectionner un commercial" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {salesReps.map((rep) => (
                                                        <SelectItem key={rep.id} value={rep.name}>
                                                            {rep.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Dialog open={showRepDialog} onOpenChange={setShowRepDialog}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-slate-900 border-white/20">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-white">Gérer les commerciaux</DialogTitle>
                                                        <DialogDescription className="text-slate-300">
                                                            Ajoutez ou supprimez des commerciaux
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="newRepName" className="text-white">Nom</Label>
                                                            <Input
                                                                id="newRepName"
                                                                placeholder="Nom du commercial"
                                                                value={newRepName}
                                                                onChange={(e) => setNewRepName(e.target.value)}
                                                                className="bg-white/5 border-white/20 text-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="newRepEmail" className="text-white">Email (optionnel)</Label>
                                                            <Input
                                                                id="newRepEmail"
                                                                type="email"
                                                                placeholder="email@example.com"
                                                                value={newRepEmail}
                                                                onChange={(e) => setNewRepEmail(e.target.value)}
                                                                className="bg-white/5 border-white/20 text-white"
                                                            />
                                                        </div>
                                                        <Button onClick={handleAddRep} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                                                            <Plus className="mr-2 h-4 w-4" /> Ajouter
                                                        </Button>
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {salesReps.map((rep) => (
                                                                <div key={rep.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                                                    <div>
                                                                        <p className="text-white font-medium">{rep.name}</p>
                                                                        {rep.email && <p className="text-slate-400 text-sm">{rep.email}</p>}
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteRep(rep.id)}
                                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="managerEmail" className="text-white">Votre Email (Manager)</Label>
                                        <Input
                                            id="managerEmail"
                                            type="email"
                                            placeholder="manager@entreprise.com"
                                            value={managerEmail}
                                            onChange={(e) => setManagerEmail(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    >
                                        Commencer l'audit <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">KPIs de la semaine</CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Mesurez l'intensité d'activité de {salesRepName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="prospecting" className="text-white">Actions de prospection</Label>
                                        <Input
                                            id="prospecting"
                                            type="number"
                                            placeholder="Nombre d'appels, emails..."
                                            value={prospectingActions}
                                            onChange={(e) => setProspectingActions(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="meetings" className="text-white">Rendez-vous de découverte</Label>
                                        <Input
                                            id="meetings"
                                            type="number"
                                            placeholder="Nombre de RDV"
                                            value={discoveryMeetings}
                                            onChange={(e) => setDiscoveryMeetings(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="proposals" className="text-white">Propositions envoyées</Label>
                                        <Input
                                            id="proposals"
                                            type="number"
                                            placeholder="Nombre de propositions"
                                            value={proposalsSent}
                                            onChange={(e) => setProposalsSent(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="signed" className="text-white">Propositions signées</Label>
                                        <Input
                                            id="signed"
                                            type="number"
                                            placeholder="Nombre de signatures"
                                            value={signedProposals}
                                            onChange={(e) => setSignedProposals(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="revenue" className="text-white">Chiffre d'affaires (€)</Label>
                                        <Input
                                            id="revenue"
                                            type="number"
                                            placeholder="Montant en euros"
                                            value={revenue}
                                            onChange={(e) => setRevenue(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleBack}
                                            variant="outline"
                                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!canProceed()}
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        >
                                            Suivant <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Test Flash : Gestion d'objection</CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Comment {salesRepName} répondrait-il/elle à cette objection ?
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                                        <p className="text-white font-medium">"{flashTestObjection}"</p>
                                    </div>
                                    <div>
                                        <Label htmlFor="response" className="text-white">Réponse de {salesRepName}</Label>
                                        <Input
                                            id="response"
                                            placeholder="Tapez la réponse..."
                                            value={flashTestResponse}
                                            onChange={(e) => setFlashTestResponse(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-white">Réponse validée ?</Label>
                                        <Button
                                            onClick={() => setFlashTestPassed(!flashTestPassed)}
                                            variant={flashTestPassed ? "default" : "outline"}
                                            className={flashTestPassed ? "bg-green-500 hover:bg-green-600" : "border-white/20 text-white hover:bg-white/10"}
                                        >
                                            {flashTestPassed ? "✓ Oui" : "Non"}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleBack}
                                            variant="outline"
                                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!canProceed()}
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        >
                                            Suivant <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Reconnaissance</CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Notez un point positif de la semaine de {salesRepName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="recognition" className="text-white">Note de reconnaissance</Label>
                                        <Input
                                            id="recognition"
                                            placeholder="Ex: Excellent closing sur le dossier XYZ"
                                            value={recognitionNote}
                                            onChange={(e) => setRecognitionNote(e.target.value)}
                                            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleBack}
                                            variant="outline"
                                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!canProceed()}
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        >
                                            Voir les résultats <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-6"
                        >
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Score de la semaine</CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Performance de {salesRepName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center">
                                        <div className="text-6xl font-bold text-white mb-2">{totalScore}</div>
                                        <div className="text-slate-300">/ 100</div>
                                        <Progress value={totalScore} className="mt-4" />
                                    </div>
                                </CardContent>
                            </Card>

                            {history.length > 1 && (
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Évolution</CardTitle>
                                        <CardDescription className="text-slate-300">
                                            Progression sur les dernières semaines
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <LineChart data={history}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" />
                                                <YAxis stroke="rgba(255,255,255,0.5)" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#a855f7"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#a855f7', r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                        <div className="mt-4 flex items-center justify-center gap-2">
                                            {trend === 'up' && (
                                                <>
                                                    <TrendingUp className="h-5 w-5 text-green-400" />
                                                    <span className="text-green-400 font-medium">
                                                        +{trendPercentage}% depuis la semaine dernière
                                                    </span>
                                                </>
                                            )}
                                            {trend === 'down' && (
                                                <>
                                                    <TrendingDown className="h-5 w-5 text-red-400" />
                                                    <span className="text-red-400 font-medium">
                                                        -{trendPercentage}% depuis la semaine dernière
                                                    </span>
                                                </>
                                            )}
                                            {trend === 'stable' && (
                                                <>
                                                    <Minus className="h-5 w-5 text-slate-400" />
                                                    <span className="text-slate-400 font-medium">
                                                        Performance stable
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border-purple-500/30">
                                <CardHeader>
                                    <CardTitle className="text-white">
                                        {trend === 'down' ? 'La courbe stagne ?' : 'Boostez encore plus vos résultats'}
                                    </CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Débloquez le potentiel de votre équipe avec un audit stratégique personnalisé
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        asChild
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    >
                                        <a
                                            href="https://meetings.hubspot.com/laurent34/rdv-laurent-15-mn"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Réserver un Audit Stratégique (15 min) <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                >
                                    <Link href="/dashboard">
                                        <BarChart3 className="mr-2 h-4 w-4" /> Tableau de bord
                                    </Link>
                                </Button>
                                <Button
                                    onClick={() => {
                                        setStep(0);
                                        setManagerEmail('');
                                        setSalesRepName('');
                                        setProspectingActions('');
                                        setDiscoveryMeetings('');
                                        setProposalsSent('');
                                        setSignedProposals('');
                                        setRevenue('');
                                        setFlashTestResponse('');
                                        setFlashTestPassed(false);
                                        setRecognitionNote('');
                                    }}
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                >
                                    Nouvel audit
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
