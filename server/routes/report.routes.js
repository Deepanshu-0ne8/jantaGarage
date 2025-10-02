import express from 'express';

const reportRouter = express.Router();

reportRouter.get('/', (req, res, next) => { 
    res.send("Get all reports route called");
});

reportRouter.get('/:id', (req, res, next) => { 
    res.send(`Get report with id route called`);
} );

reportRouter.get('/user/:id', (req, res, next) => { 
    res.send(`Get reports for user with id route called`);
});

reportRouter.delete('/delete/:id', (req, res, next) => { 
    res.send(`Delete report with id route called`);
});

export default reportRouter;